-- Wallex: tablas y permisos de la base de datos en Supabase.
-- Se corre en Supabase → SQL Editor → New query. Se puede volver a correr sin perder datos.

-- 1. Perfiles: lo que la persona da al registrarse (nombre, si busca o publica y, si publica, cómo y su celular)
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  rol text not null default 'busca' check (rol in ('busca', 'publica')),
  tipo_anunciante text check (tipo_anunciante in ('propietario', 'inmobiliaria', 'arrendatario')),
  celular text check (celular ~ '^3[0-9]{9}$'),
  creado timestamptz not null default now()
);
alter table public.perfiles enable row level security;

drop policy if exists "perfiles: ver el propio" on public.perfiles;
create policy "perfiles: ver el propio" on public.perfiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "perfiles: editar el propio" on public.perfiles;
create policy "perfiles: editar el propio" on public.perfiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- El perfil se crea solo al registrarse, con los datos que manda el formulario
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  datos jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.perfiles (id, nombre, rol, tipo_anunciante, celular)
  values (
    new.id,
    coalesce(datos ->> 'nombre', ''),
    case when datos ->> 'rol' = 'publica' then 'publica' else 'busca' end,
    case when datos ->> 'tipo_anunciante' in ('propietario', 'inmobiliaria', 'arrendatario') then datos ->> 'tipo_anunciante' end,
    case when datos ->> 'celular' ~ '^3[0-9]{9}$' then datos ->> 'celular' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil();

-- Cuentas creadas antes de esta tabla
insert into public.perfiles (id, nombre)
select id, coalesce(raw_user_meta_data ->> 'nombre', '') from auth.users
on conflict (id) do nothing;

-- 2. Publicaciones: la ficha estándar de cada arriendo
create table if not exists public.inmuebles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  estado text not null default 'publicado' check (estado in ('publicado', 'pausado')),
  tipo_anunciante text not null check (tipo_anunciante in ('propietario', 'inmobiliaria', 'arrendatario')),
  titulo text not null check (char_length(titulo) between 8 and 90),
  zona text not null check (char_length(zona) between 2 and 40),
  barrio text not null check (char_length(barrio) between 2 and 60),
  estrato smallint not null check (estrato between 1 and 6),
  area integer not null check (area between 10 and 2000),
  habitaciones smallint not null check (habitaciones between 0 and 10),
  banos smallint not null check (banos between 1 and 10),
  canon integer not null check (canon between 200000 and 50000000),
  administracion integer not null default 0 check (administracion between 0 and 10000000),
  deposito integer not null default 0 check (deposito between 0 and 100000000),
  pide_codeudor boolean not null default false,
  ingresos_veces numeric(3, 1) not null default 0 check (ingresos_veces between 0 and 5),
  acepta_mascotas boolean not null default false,
  plazo_meses smallint not null default 12 check (plazo_meses between 1 and 60),
  transporte text not null default '' check (char_length(transporte) <= 120),
  descripcion text not null default '' check (char_length(descripcion) <= 1500),
  fotos text[] not null check (cardinality(fotos) between 1 and 8),
  creado timestamptz not null default now()
);
alter table public.inmuebles enable row level security;
create index if not exists inmuebles_publicados on public.inmuebles (estado, creado desc);

drop policy if exists "inmuebles: ver publicados y propios" on public.inmuebles;
create policy "inmuebles: ver publicados y propios" on public.inmuebles
  for select to anon, authenticated using (estado = 'publicado' or user_id = (select auth.uid()));
drop policy if exists "inmuebles: publicar" on public.inmuebles;
create policy "inmuebles: publicar" on public.inmuebles
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "inmuebles: editar los propios" on public.inmuebles;
create policy "inmuebles: editar los propios" on public.inmuebles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "inmuebles: borrar los propios" on public.inmuebles;
create policy "inmuebles: borrar los propios" on public.inmuebles
  for delete to authenticated using (user_id = (select auth.uid()));

-- 3. Contacto de cada publicación: nombre y celular. Solo lo ven personas con cuenta, y solo de lo publicado.
create table if not exists public.contactos (
  inmueble_id uuid primary key references public.inmuebles (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 80),
  celular text not null check (celular ~ '^3[0-9]{9}$')
);
alter table public.contactos enable row level security;

drop policy if exists "contactos: ver con cuenta" on public.contactos;
create policy "contactos: ver con cuenta" on public.contactos
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.inmuebles i where i.id = inmueble_id and i.estado = 'publicado')
  );
drop policy if exists "contactos: crear el propio" on public.contactos;
create policy "contactos: crear el propio" on public.contactos
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.inmuebles i where i.id = inmueble_id and i.user_id = (select auth.uid()))
  );
drop policy if exists "contactos: editar el propio" on public.contactos;
create policy "contactos: editar el propio" on public.contactos
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 4. Favoritos. inmueble_id es texto: sirve para los de ejemplo ('1' a '6') y para los publicados (uuid)
create table if not exists public.favoritos (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  inmueble_id text not null check (char_length(inmueble_id) between 1 and 40),
  creado timestamptz not null default now(),
  primary key (user_id, inmueble_id)
);
alter table public.favoritos enable row level security;

drop policy if exists "favoritos: los propios" on public.favoritos;
create policy "favoritos: los propios" on public.favoritos
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 5. Fotos de las publicaciones: cualquiera las ve; cada quien sube y borra solo en su carpeta
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: subir a la carpeta propia" on storage.objects;
create policy "fotos: subir a la carpeta propia" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "fotos: borrar las propias" on storage.objects;
create policy "fotos: borrar las propias" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- 6. Verificación de identidad con Didit. Las fotos de la cédula y la selfie las toma y las guarda Didit;
--    Wallex guarda solo el estado de cada verificación. Solo las funciones de Wallex (verificacion y
--    didit-webhook, con la llave secreta) crean y cambian estas filas: desde el navegador solo se leen.
create table if not exists public.verificaciones (
  session_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  estado text not null default 'Not Started',
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
alter table public.verificaciones enable row level security;
create index if not exists verificaciones_por_persona on public.verificaciones (user_id, creado desc);

drop policy if exists "verificaciones: ver las propias" on public.verificaciones;
create policy "verificaciones: ver las propias" on public.verificaciones
  for select to authenticated using (user_id = (select auth.uid()));

-- Quién tiene la identidad verificada. Se ve la propia y la de quien tiene arriendos publicados,
-- porque eso es lo que dice el sello de sus arriendos. De quien solo busca, no lo ve nadie más.
create table if not exists public.identidades (
  user_id uuid primary key references auth.users (id) on delete cascade,
  verificada timestamptz not null default now()
);
alter table public.identidades enable row level security;

drop policy if exists "identidades: la propia y las de quien publica" on public.identidades;
create policy "identidades: la propia y las de quien publica" on public.identidades
  for select to anon, authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.inmuebles i where i.user_id = identidades.user_id and i.estado = 'publicado')
  );

-- Con la verificación de verdad, el contacto de quien publica solo lo ve quien ya verificó su identidad
-- (y quien publica, el suyo). Reemplaza la regla de la sección 3, que pedía solo tener cuenta.
drop policy if exists "contactos: ver con cuenta" on public.contactos;
drop policy if exists "contactos: ver con identidad verificada" on public.contactos;
create policy "contactos: ver con identidad verificada" on public.contactos
  for select to authenticated using (
    user_id = (select auth.uid())
    or (
      exists (select 1 from public.inmuebles i where i.id = inmueble_id and i.estado = 'publicado')
      and exists (select 1 from public.identidades v where v.user_id = (select auth.uid()))
    )
  );
