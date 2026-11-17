-- =========================================================
-- Esquema base: enums, tablas, índices y triggers
-- =========================================================

-- Funciones internas fuera del esquema expuesto por la Data API
create schema if not exists private;
revoke all on schema private from public;

-- Enums
create type public.user_role        as enum ('customer','staff','admin','courier');
create type public.fulfillment_type as enum ('pickup','delivery');
create type public.order_status     as enum ('pending','confirmed','preparing','ready','out_for_delivery','completed','cancelled');
create type public.payment_status   as enum ('unpaid','paid','refunded');
create type public.payment_method   as enum ('cash','transfer');
create type public.delivery_status  as enum ('pending','assigned','picked_up','delivered','failed');
create type public.masa_type        as enum ('maiz','arroz');
create type public.curtido_type     as enum ('normal','extra');
create type public.salsa_type       as enum ('bote','bolsa');

-- updated_at genérico
create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Código corto legible (sin 0/O/1/I/L): 31^6 ≈ 887M combinaciones
create or replace function private.generate_order_code()
returns text language sql volatile set search_path = '' as $$
  select string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6);
$$;

-- ---------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text check (char_length(full_name) <= 80),
  phone      text check (phone ~ '^[0-9]{8}$'),
  role       public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role) where role <> 'customer';

create table public.products (
  key         text primary key check (key ~ '^[a-z0-9-]+$'),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  description text not null default '',
  price_cents integer not null check (price_cents > 0),
  image_url   text,
  badge       jsonb check (badge is null or (jsonb_typeof(badge) = 'object' and badge ? 'label' and badge ? 'tone')),
  default_qty integer not null default 0 check (default_qty between 0 and 20),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Tarifa de envío por zona/colonia (Q5). Con una sola fila = tarifa fija.
create table public.delivery_zones (
  id         smallint generated always as identity primary key,
  name       text not null unique check (char_length(btrim(name)) between 2 and 60),
  fee_cents  integer not null check (fee_cents >= 0),
  is_active  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique default private.generate_order_code()
                       check (code ~ '^[2-9A-HJKMNP-Z]{6}$'),
  tracking_token     uuid not null default gen_random_uuid(),
  customer_id        uuid references public.profiles(id) on delete set null,
  customer_name      text not null check (char_length(btrim(customer_name)) between 1 and 80),
  customer_phone     text not null check (customer_phone ~ '^[0-9]{8}$'),
  fulfillment        public.fulfillment_type not null default 'pickup',
  curtido            public.curtido_type not null default 'normal',
  salsa              public.salsa_type not null default 'bote',
  slot               text not null check (slot in ('15','30','45','custom')),
  scheduled_for      timestamptz not null,
  notes              text check (char_length(notes) <= 280),
  status             public.order_status not null default 'pending',
  payment_status     public.payment_status not null default 'unpaid',
  payment_method     public.payment_method,
  subtotal_cents     integer not null default 0 check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  total_cents        integer generated always as (subtotal_cents + delivery_fee_cents) stored,
  paid_at            timestamptz,
  completed_at       timestamptz,
  cancelled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint orders_pickup_has_no_fee     check (fulfillment = 'delivery' or delivery_fee_cents = 0),
  constraint orders_pickup_never_on_route check (fulfillment = 'delivery' or status <> 'out_for_delivery'),
  constraint orders_paid_has_method       check (payment_status = 'unpaid' or payment_method is not null)
);
create index orders_created_at_idx     on public.orders (created_at desc);
create index orders_active_status_idx  on public.orders (status, scheduled_for) where status not in ('completed','cancelled');
create index orders_customer_idx       on public.orders (customer_id) where customer_id is not null;
create index orders_phone_created_idx  on public.orders (customer_phone, created_at desc);
create index orders_paid_at_idx        on public.orders (paid_at) where payment_status = 'paid';

-- Líneas con snapshot de nombre y precio. La masa es por línea
-- (la UI la usa como valor "global por defecto").
create table public.order_items (
  id               bigint generated always as identity primary key,
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_key      text not null references public.products(key) on update cascade on delete restrict,
  masa             public.masa_type not null default 'maiz',
  product_name     text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity between 1 and 50),
  line_total_cents integer generated always as (unit_price_cents * quantity) stored,
  unique (order_id, product_key, masa)
);
create index order_items_product_idx on public.order_items (product_key);

-- Solo existe si orders.fulfillment = 'delivery'
create table public.deliveries (
  order_id       uuid primary key references public.orders(id) on delete cascade,
  zone_id        smallint references public.delivery_zones(id) on delete restrict,
  address        text not null check (char_length(btrim(address)) between 5 and 200),
  reference      text check (char_length(reference) <= 200),
  courier_id     uuid references public.profiles(id) on delete set null,
  status         public.delivery_status not null default 'pending',
  assigned_at    timestamptz,
  picked_up_at   timestamptz,
  delivered_at   timestamptz,
  failure_reason text check (char_length(failure_reason) <= 280),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint deliveries_failed_has_reason check (status <> 'failed' or failure_reason is not null)
);
create index deliveries_courier_idx on public.deliveries (courier_id, status) where courier_id is not null;
create index deliveries_zone_idx    on public.deliveries (zone_id);

-- Historial (auditoría) de estado de pedido
create table public.order_status_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index order_status_events_order_idx      on public.order_status_events (order_id, created_at);
create index order_status_events_changed_by_idx on public.order_status_events (changed_by);

-- ---------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------

create trigger profiles_updated_at       before update on public.profiles       for each row execute function private.set_updated_at();
create trigger products_updated_at       before update on public.products       for each row execute function private.set_updated_at();
create trigger delivery_zones_updated_at before update on public.delivery_zones for each row execute function private.set_updated_at();
create trigger orders_updated_at         before update on public.orders         for each row execute function private.set_updated_at();
create trigger deliveries_updated_at     before update on public.deliveries     for each row execute function private.set_updated_at();

-- Perfil automático al registrarse (full_name es solo dato visible, nunca autorización)
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 80));
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function private.handle_new_user();

-- Máquina de estados del pedido (misma tabla que ORDER_TRANSITIONS en TS)
create or replace function private.order_transition_ok(
  p_from public.order_status, p_to public.order_status, p_fulfillment public.fulfillment_type)
returns boolean language sql immutable set search_path = '' as $$
  select case p_from
    when 'pending'          then p_to in ('confirmed','cancelled')
    when 'confirmed'        then p_to in ('preparing','cancelled')
    when 'preparing'        then p_to in ('ready','cancelled')
    when 'ready'            then (p_fulfillment = 'pickup'   and p_to = 'completed')
                              or (p_fulfillment = 'delivery' and p_to = 'out_for_delivery')
    when 'out_for_delivery' then p_to in ('completed','cancelled')
    else false
  end;
$$;

-- Valida transición, sella tiempos y escribe historial
create or replace function private.orders_track_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if not private.order_transition_ok(old.status, new.status, new.fulfillment) then
      raise exception 'INVALID_TRANSITION:% -> %', old.status, new.status using errcode = '22023';
    end if;
    if new.status = 'completed' then new.completed_at := now(); end if;
    if new.status = 'cancelled' then new.cancelled_at := now(); end if;
    insert into public.order_status_events (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    new.paid_at := now();
  end if;
  return new;
end $$;
create trigger orders_track_changes
  before update on public.orders for each row execute function private.orders_track_changes();

-- Entrega: sella tiempos y mantiene orders.status sincronizado
create or replace function private.deliveries_track_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.courier_id is distinct from old.courier_id then
    new.assigned_at := case when new.courier_id is null then null else now() end;
    if new.status in ('pending','assigned') then
      new.status := case when new.courier_id is null then 'pending' else 'assigned' end;
    end if;
  end if;

  if new.status is distinct from old.status then
    case new.status
      when 'picked_up' then
        new.picked_up_at := now();
        update public.orders set status = 'out_for_delivery' where id = new.order_id and status = 'ready';
        if not found then
          raise exception 'ORDER_NOT_READY' using errcode = '22023';
        end if;
      when 'delivered' then
        new.delivered_at := now();
        update public.orders set status = 'completed' where id = new.order_id and status = 'out_for_delivery';
        if not found then
          raise exception 'ORDER_NOT_OUT_FOR_DELIVERY' using errcode = '22023';
        end if;
      when 'failed' then
        update public.orders set status = 'cancelled' where id = new.order_id and status = 'out_for_delivery';
        if not found then
          raise exception 'ORDER_NOT_OUT_FOR_DELIVERY' using errcode = '22023';
        end if;
      else null;
    end case;
  end if;
  return new;
end $$;
create trigger deliveries_track_changes
  before update on public.deliveries for each row execute function private.deliveries_track_changes();
