-- =========================================================
-- Helpers de autorización, RLS y privilegios
-- =========================================================

-- Helpers en "private" (no expuestos como RPC). security definer para leer
-- profiles sin recursión de RLS; solo responden sobre auth.uid().
create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('staff','admin') from public.profiles where id = auth.uid()), false);
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function private.is_order_owner(p_order_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.orders o where o.id = p_order_id and o.customer_id = auth.uid());
$$;

create or replace function private.is_order_courier(p_order_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.deliveries d where d.order_id = p_order_id and d.courier_id = auth.uid());
$$;

revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_staff(), private.is_admin(),
  private.is_order_owner(uuid), private.is_order_courier(uuid) to authenticated;
grant execute on function private.generate_order_code() to service_role;

-- RLS en todas las tablas expuestas
alter table public.profiles            enable row level security;
alter table public.products            enable row level security;
alter table public.delivery_zones      enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.deliveries          enable row level security;
alter table public.order_status_events enable row level security;

-- Privilegios explícitos (la Data API puede no exponer tablas nuevas por defecto)
revoke all on all tables in schema public from anon, authenticated;
grant select on public.products, public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.products, public.delivery_zones to authenticated;
grant select on public.profiles, public.orders, public.order_items,
                public.deliveries, public.order_status_events to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant update (status, payment_status, payment_method) on public.orders to authenticated;
grant update (courier_id, status, failure_reason, zone_id, address, reference) on public.deliveries to authenticated;

-- products
create policy "products: anon lee activos" on public.products
  for select to anon using (is_active);
create policy "products: leer activos o staff" on public.products
  for select to authenticated using (is_active or (select private.is_staff()));
create policy "products: admin inserta" on public.products
  for insert to authenticated with check ((select private.is_admin()));
create policy "products: admin edita" on public.products
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "products: admin borra" on public.products
  for delete to authenticated using ((select private.is_admin()));

-- delivery_zones
create policy "zones: anon lee activas" on public.delivery_zones
  for select to anon using (is_active);
create policy "zones: leer activas o staff" on public.delivery_zones
  for select to authenticated using (is_active or (select private.is_staff()));
create policy "zones: admin inserta" on public.delivery_zones
  for insert to authenticated with check ((select private.is_admin()));
create policy "zones: admin edita" on public.delivery_zones
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "zones: admin borra" on public.delivery_zones
  for delete to authenticated using ((select private.is_admin()));

-- profiles (role solo cambia con secret key: no hay grant de update sobre role)
create policy "profiles: ver propio o staff" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select private.is_staff()));
create policy "profiles: editar propio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- orders (sin INSERT/DELETE desde clientes: se crean con place_order y se cancelan)
create policy "orders: ver propios, asignados o staff" on public.orders
  for select to authenticated using (
    customer_id = (select auth.uid())
    or (select private.is_staff())
    or private.is_order_courier(id)
  );
create policy "orders: staff actualiza" on public.orders
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

-- order_items
create policy "order_items: ver si ve el pedido" on public.order_items
  for select to authenticated using (
    (select private.is_staff()) or private.is_order_owner(order_id) or private.is_order_courier(order_id)
  );

-- deliveries
create policy "deliveries: ver" on public.deliveries
  for select to authenticated using (
    (select private.is_staff()) or courier_id = (select auth.uid()) or private.is_order_owner(order_id)
  );
create policy "deliveries: staff o repartidor asignado actualiza" on public.deliveries
  for update to authenticated
  using ((select private.is_staff()) or courier_id = (select auth.uid()))
  with check ((select private.is_staff()) or courier_id = (select auth.uid()));

-- El repartidor solo cambia status/failure_reason de sus entregas
create or replace function private.deliveries_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not private.is_staff() then
    if new.courier_id is distinct from old.courier_id
       or new.address is distinct from old.address
       or new.reference is distinct from old.reference
       or new.zone_id is distinct from old.zone_id then
      raise exception 'Solo el staff puede cambiar repartidor, zona o dirección' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke execute on function private.deliveries_guard() from public;
-- "a_" para que corra antes de deliveries_track_changes (orden alfabético)
create trigger a_deliveries_guard before update on public.deliveries
  for each row execute function private.deliveries_guard();

-- order_status_events
create policy "status_events: staff lee" on public.order_status_events
  for select to authenticated using ((select private.is_staff()));
