-- =========================================================
-- Datos de prueba (mock) para desarrollo. NO correr en producción.
-- Requiere las migraciones y seed.sql aplicados.
--
-- Idempotente: borra y recrea todo lo marcado como mock
--   - usuarios con email @mock.expresspupusa.test (sin contraseña: no pueden iniciar sesión)
--   - pedidos con teléfono 7000xxxx
-- Genera ~14 días de pedidos (más los fines de semana); los de la última hora
-- quedan en estados activos según su antigüedad.
-- =========================================================

begin;

delete from public.orders where customer_phone like '7000%';
delete from auth.users where email like '%@mock.expresspupusa.test';

insert into public.delivery_zones (name, fee_cents, sort_order) values
  ('Centro de San Salvador', 100, 1),
  ('Colonia Escalón',        150, 2),
  ('Santa Tecla',            200, 3)
on conflict (name) do update
  set fee_cents = excluded.fee_cents, sort_order = excluded.sort_order, is_active = true;

create temp table _mock_users (
  id        uuid primary key,
  email     text not null,
  full_name text not null,
  phone     text not null,
  role      public.user_role not null
) on commit drop;

insert into _mock_users values
  ('00000000-0000-4000-8000-000000000001', 'admin@mock.expresspupusa.test',    'Ana Martínez',     '70000001', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'staff1@mock.expresspupusa.test',   'José Hernández',   '70000002', 'staff'),
  ('00000000-0000-4000-8000-000000000003', 'staff2@mock.expresspupusa.test',   'María López',      '70000003', 'staff'),
  ('00000000-0000-4000-8000-000000000004', 'courier1@mock.expresspupusa.test', 'Carlos Ramírez',   '70000004', 'courier'),
  ('00000000-0000-4000-8000-000000000005', 'courier2@mock.expresspupusa.test', 'Luis Flores',      '70000005', 'courier'),
  ('00000000-0000-4000-8000-000000000006', 'sofia@mock.expresspupusa.test',    'Sofía Rivera',     '70000006', 'customer'),
  ('00000000-0000-4000-8000-000000000007', 'diego@mock.expresspupusa.test',    'Diego Castillo',   '70000007', 'customer'),
  ('00000000-0000-4000-8000-000000000008', 'gabriela@mock.expresspupusa.test', 'Gabriela Mejía',   '70000008', 'customer'),
  ('00000000-0000-4000-8000-000000000009', 'fernando@mock.expresspupusa.test', 'Fernando Alvarado','70000009', 'customer'),
  ('00000000-0000-4000-8000-000000000010', 'valeria@mock.expresspupusa.test',  'Valeria Portillo', '70000010', 'customer'),
  ('00000000-0000-4000-8000-000000000011', 'ricardo@mock.expresspupusa.test',  'Ricardo Menjívar', '70000011', 'customer');

-- El trigger on_auth_user_created crea cada profile
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, '', now() - interval '30 days',
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', full_name),
       now() - interval '30 days', now(), '', '', '', ''
from _mock_users;

update public.profiles p
   set role = u.role, phone = u.phone, created_at = now() - interval '30 days'
  from _mock_users u
 where p.id = u.id;

do $$
declare
  v_tz         constant text := 'America/El_Salvador';
  v_offsets    constant jsonb := '{"pending":0,"confirmed":2,"preparing":4,"ready":14,"out_for_delivery":18}';
  v_guests     constant text[] := array['Karla','Mauricio','Jennifer','Óscar','Patricia','Kevin','Rosa','Wilfredo',
                                        'Daniela','Edwin','Claudia','Marvin','Lucía','Roberto','Andrea','Nelson'];
  v_addresses  constant text[] := array['Calle Arce #1024, Centro','Av. España, pasaje 3, casa 12',
                                        'Paseo General Escalón #4520','Calle La Mascota, Col. Escalón, casa 7',
                                        '3a Av. Norte #18, Santa Tecla','Res. Las Palmeras, polígono B, casa 21'];
  v_refs       constant text[] := array['Portón negro','Frente a la tienda','Casa esquinera azul',
                                        'Al lado de la farmacia', null, null];
  v_notes      constant text[] := array['Sin cebolla en el curtido','Bien doraditas, por favor','Traer cambio de $20',
                                        'Llamar al llegar','Salsa aparte'];
  v_staff      uuid[];
  v_couriers   uuid[];
  v_customers  uuid[];
  v_zones      smallint[];
  d int; n int; k int; i int;
  v_created    timestamptz;
  v_age        numeric;
  v_customer   uuid;
  v_name       text;
  v_phone      text;
  v_fulfill    public.fulfillment_type;
  v_path       text[];
  v_ts         timestamptz[];
  v_status     text;
  v_cancel     boolean;
  v_failed     boolean;
  v_method     public.payment_method;
  v_pay        public.payment_status;
  v_paid_at    timestamptz;
  v_slot       text;
  v_zone       smallint;
  v_fee        integer;
  v_courier    uuid;
  v_items      jsonb;
  v_subtotal   integer;
  v_order_id   uuid;
  v_done       timestamptz;
  v_cancelled  timestamptz;
begin
  perform setseed(0.42);

  select array_agg(id order by id) into v_staff     from _mock_users where role in ('staff','admin');
  select array_agg(id order by id) into v_couriers  from _mock_users where role = 'courier';
  select array_agg(id order by id) into v_customers from _mock_users where role = 'customer';
  select array_agg(id order by sort_order) into v_zones from public.delivery_zones where is_active;

  for d in 0..13 loop
    n := 3 + floor(random() * 4)::int
           + case when extract(isodow from (now() at time zone v_tz)::date - d) in (5, 6, 7) then 4 else 0 end
           + case when d = 0 then 6 else 0 end;

    for k in 1..n loop
      if d = 0 and k <= 6 then
        -- Hoy: 6 pedidos activos escalonados (pending → out_for_delivery)
        v_created := now() - make_interval(mins => (array[1, 3, 6, 10, 16, 25])[k]);
      elsif d = 0 then
        v_created := now() - make_interval(mins => 60 + floor(random() * 240)::int);
      else
        v_created := ((((now() at time zone v_tz)::date - d) + time '10:00'
                       + make_interval(mins => floor(random() * 600)::int)) at time zone v_tz);
      end if;
      v_age := extract(epoch from now() - v_created) / 60;

      -- Cliente registrado (≈45%) o invitado
      if random() < 0.45 then
        v_customer := v_customers[1 + floor(random() * array_length(v_customers, 1))::int];
        select full_name, phone into v_name, v_phone from _mock_users where id = v_customer;
      else
        v_customer := null;
        v_name  := v_guests[1 + floor(random() * array_length(v_guests, 1))::int];
        v_phone := '7000' || lpad((1000 + floor(random() * 9000))::int::text, 4, '0');
      end if;

      v_fulfill := case when (d = 0 and k in (5, 6)) or random() < 0.4 then 'delivery' else 'pickup' end;
      v_slot    := (array['15','15','30','30','45','custom'])[1 + floor(random() * 6)::int];
      v_method  := case when random() < 0.65 then 'cash' else 'transfer' end;

      -- Camino completo de estados
      v_path := case v_fulfill
                  when 'pickup'   then array['pending','confirmed','preparing','ready','completed']
                  else                 array['pending','confirmed','preparing','ready','out_for_delivery','completed']
                end;
      v_cancel := false; v_failed := false;

      if v_age < 60 then
        -- Pedido activo: el estado depende de su antigüedad
        v_path := array(select s from unnest(v_path) s
                        where s <> 'completed' and (v_offsets ->> s)::int <= v_age);
      elsif v_fulfill = 'delivery' and random() < 0.05 then
        v_failed := true;
        v_path := v_path[1:5] || array['cancelled'];
      elsif random() < 0.08 then
        v_cancel := true;
        v_path := v_path[1:1 + floor(random() * 3)::int] || array['cancelled'];
      end if;
      v_status := v_path[array_length(v_path, 1)];

      -- Tiempos de cada evento
      v_ts := array[]::timestamptz[];
      for i in 1..array_length(v_path, 1) loop
        v_ts := v_ts || case
          when v_path[i] = 'completed' and v_fulfill = 'pickup' then v_created + interval '20 minutes'
          when v_path[i] = 'completed'                          then v_created + interval '35 minutes'
          when v_path[i] = 'cancelled'                          then v_ts[i - 1] + interval '3 minutes'
          else v_created + make_interval(mins => (v_offsets ->> v_path[i])::int)
        end;
      end loop;
      v_done      := case when v_status = 'completed' then v_ts[array_length(v_ts, 1)] end;
      v_cancelled := case when v_status = 'cancelled' then v_ts[array_length(v_ts, 1)] end;

      -- Pago
      if v_method = 'transfer' then
        v_pay := case when v_status = 'cancelled' then 'refunded' else 'paid' end;
        v_paid_at := v_created + interval '1 minute';
      elsif v_status = 'completed' then
        v_pay := 'paid'; v_paid_at := v_done;
      else
        v_pay := 'unpaid'; v_paid_at := null;
      end if;

      -- Entrega
      v_zone := null; v_fee := 0; v_courier := null;
      if v_fulfill = 'delivery' then
        v_zone := v_zones[1 + floor(random() * array_length(v_zones, 1))::int];
        select fee_cents into v_fee from public.delivery_zones where id = v_zone;
        if 'preparing' = any(v_path) and not v_cancel then
          v_courier := v_couriers[1 + floor(random() * array_length(v_couriers, 1))::int];
        end if;
      end if;

      -- Líneas: 1–3 productos distintos, precio y nombre del catálogo
      select jsonb_agg(jsonb_build_object(
               'key', p.key, 'name', p.name, 'price', p.price_cents,
               'qty', 1 + floor(random() * 5)::int,
               'masa', case when random() < 0.75 then 'maiz' else 'arroz' end))
        into v_items
        from (select * from public.products where is_active
              order by random() limit 1 + floor(random() * 3)::int) p;
      select sum((x ->> 'price')::int * (x ->> 'qty')::int) into v_subtotal from jsonb_array_elements(v_items) x;

      insert into public.orders (
        customer_id, customer_name, customer_phone, fulfillment, curtido, salsa, slot, scheduled_for,
        notes, status, payment_status, payment_method, subtotal_cents, delivery_fee_cents,
        paid_at, completed_at, cancelled_at, created_at, updated_at
      ) values (
        v_customer, v_name, v_phone, v_fulfill,
        case when random() < 0.3 then 'extra' else 'normal' end::public.curtido_type,
        case when random() < 0.6 then 'bote'  else 'bolsa'  end::public.salsa_type,
        v_slot,
        v_created + make_interval(mins => case v_slot when 'custom' then 60 else v_slot::int end),
        case when random() < 0.2 then v_notes[1 + floor(random() * array_length(v_notes, 1))::int] end,
        v_status::public.order_status, v_pay, v_method, v_subtotal, v_fee,
        v_paid_at, v_done, v_cancelled, v_created, v_ts[array_length(v_ts, 1)]
      ) returning id into v_order_id;

      insert into public.order_items (order_id, product_key, masa, product_name, unit_price_cents, quantity)
      select v_order_id, x ->> 'key', (x ->> 'masa')::public.masa_type, x ->> 'name',
             (x ->> 'price')::int, (x ->> 'qty')::int
        from jsonb_array_elements(v_items) x;

      if v_fulfill = 'delivery' then
        insert into public.deliveries (
          order_id, zone_id, address, reference, courier_id, status,
          assigned_at, picked_up_at, delivered_at, failure_reason, created_at, updated_at
        ) values (
          v_order_id, v_zone,
          v_addresses[1 + floor(random() * array_length(v_addresses, 1))::int],
          v_refs[1 + floor(random() * array_length(v_refs, 1))::int],
          v_courier,
          case
            when v_failed                       then 'failed'
            when v_status = 'completed'         then 'delivered'
            when v_status = 'out_for_delivery'  then 'picked_up'
            when v_courier is not null          then 'assigned'
            else 'pending'
          end::public.delivery_status,
          case when v_courier is not null then v_created + interval '5 minutes' end,
          case when 'out_for_delivery' = any(v_path) then v_created + interval '18 minutes' end,
          v_done,
          case when v_failed then 'Cliente no contestó y no se encontró la dirección' end,
          v_created, v_ts[array_length(v_ts, 1)]
        );
      end if;

      insert into public.order_status_events (order_id, from_status, to_status, changed_by, created_at)
      select v_order_id,
             case when e.idx > 1 then v_path[e.idx - 1]::public.order_status end,
             v_path[e.idx]::public.order_status,
             case
               when e.idx = 1 then null
               when v_fulfill = 'delivery' and v_path[e.idx] = 'completed' then v_courier
               when v_fulfill = 'delivery' and v_path[e.idx] = 'out_for_delivery' then v_courier
               when v_failed and v_path[e.idx] = 'cancelled' then v_courier
               else v_staff[1 + floor(random() * array_length(v_staff, 1))::int]
             end,
             v_ts[e.idx]
        from generate_subscripts(v_path, 1) as e(idx);
    end loop;
  end loop;
end $$;

commit;

-- Resumen
select status, fulfillment, count(*) as orders, sum(total_cents) as total_cents
  from public.orders where customer_phone like '7000%'
 group by 1, 2 order by 1, 2;
