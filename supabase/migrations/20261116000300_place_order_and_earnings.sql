-- =========================================================
-- place_order (atómico, recalcula precios) y vistas de ganancias
-- =========================================================

-- Solo la llama el servidor con la secret key (service_role, ya ignora RLS),
-- por eso es security invoker. El servidor decide customer_id.
-- payload:
-- { customer_id?, customer_name, customer_phone, fulfillment, curtido, salsa,
--   slot, scheduled_for, notes?, items: [{product_key, quantity, masa}],
--   delivery?: {address, reference?, zone_id} }
create or replace function public.place_order(payload jsonb)
returns table (id uuid, code text, tracking_token uuid, total_cents integer)
language plpgsql security invoker set search_path = '' as $$
declare
  v_order_id    uuid;
  v_code        text;
  v_subtotal    integer := 0;
  v_fee         integer := 0;
  v_zone_id     smallint;
  v_item        jsonb;
  v_product     public.products%rowtype;
  v_fulfillment public.fulfillment_type := coalesce(payload ->> 'fulfillment', 'pickup')::public.fulfillment_type;
begin
  if jsonb_typeof(payload -> 'items') is distinct from 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'EMPTY_ORDER' using errcode = '22023';
  end if;

  if v_fulfillment = 'delivery' then
    v_zone_id := (payload -> 'delivery' ->> 'zone_id')::smallint;
    select z.fee_cents into v_fee from public.delivery_zones z where z.id = v_zone_id and z.is_active;
    if not found then
      raise exception 'UNKNOWN_ZONE' using errcode = '22023';
    end if;
  end if;

  for i in 1..5 loop
    v_code := private.generate_order_code();
    exit when not exists (select 1 from public.orders o where o.code = v_code);
  end loop;

  insert into public.orders (
    code, customer_id, customer_name, customer_phone, fulfillment, curtido, salsa,
    slot, scheduled_for, notes, delivery_fee_cents
  ) values (
    v_code,
    nullif(payload ->> 'customer_id', '')::uuid,
    btrim(payload ->> 'customer_name'),
    regexp_replace(payload ->> 'customer_phone', '\D', '', 'g'),
    v_fulfillment,
    coalesce(payload ->> 'curtido', 'normal')::public.curtido_type,
    coalesce(payload ->> 'salsa', 'bote')::public.salsa_type,
    payload ->> 'slot',
    (payload ->> 'scheduled_for')::timestamptz,
    nullif(btrim(payload ->> 'notes'), ''),
    v_fee
  ) returning orders.id into v_order_id;

  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    select * into v_product from public.products p
      where p.key = v_item ->> 'product_key' and p.is_active;
    if not found then
      raise exception 'UNKNOWN_PRODUCT:%', v_item ->> 'product_key' using errcode = '22023';
    end if;
    insert into public.order_items (order_id, product_key, masa, product_name, unit_price_cents, quantity)
    values (v_order_id, v_product.key,
            coalesce(v_item ->> 'masa', 'maiz')::public.masa_type,
            v_product.name, v_product.price_cents, (v_item ->> 'quantity')::integer);
    v_subtotal := v_subtotal + v_product.price_cents * (v_item ->> 'quantity')::integer;
  end loop;

  update public.orders o set subtotal_cents = v_subtotal where o.id = v_order_id;

  if v_fulfillment = 'delivery' then
    insert into public.deliveries (order_id, zone_id, address, reference)
    values (v_order_id, v_zone_id,
            btrim(payload -> 'delivery' ->> 'address'),
            nullif(btrim(payload -> 'delivery' ->> 'reference'), ''));
  end if;

  insert into public.order_status_events (order_id, from_status, to_status, changed_by)
  values (v_order_id, null, 'pending', null);

  return query select o.id, o.code, o.tracking_token, o.total_cents from public.orders o where o.id = v_order_id;
end $$;

revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
grant  execute on function public.place_order(jsonb) to service_role;

-- Ganancias = ingreso bruto cobrado (pagado y no cancelado), por día en El Salvador.
-- security_invoker: respetan RLS (solo staff/admin ven filas).
create or replace view public.earnings_daily with (security_invoker = true) as
select
  (o.paid_at at time zone 'America/El_Salvador')::date as day,
  count(*)::integer                                     as orders_count,
  coalesce(sum(i.units), 0)::integer                    as units,
  sum(o.subtotal_cents)::integer                        as subtotal_cents,
  sum(o.delivery_fee_cents)::integer                    as delivery_fees_cents,
  sum(o.total_cents)::integer                           as gross_cents
from public.orders o
left join lateral (
  select sum(oi.quantity) as units from public.order_items oi where oi.order_id = o.id
) i on true
where o.payment_status = 'paid' and o.status <> 'cancelled'
group by 1;

create or replace view public.earnings_by_product with (security_invoker = true) as
select
  (o.paid_at at time zone 'America/El_Salvador')::date as day,
  oi.product_key,
  oi.product_name,
  oi.masa,
  sum(oi.quantity)::integer         as units,
  sum(oi.line_total_cents)::integer as revenue_cents
from public.order_items oi
join public.orders o on o.id = oi.order_id
where o.payment_status = 'paid' and o.status <> 'cancelled'
group by 1, 2, 3, 4;

revoke all on public.earnings_daily, public.earnings_by_product from anon, authenticated;
grant select on public.earnings_daily, public.earnings_by_product to authenticated;
