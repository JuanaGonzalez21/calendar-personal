-- ================================================================
-- MI DÍA · Fase 1 — Esquema base
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ================================================================
-- Orden: enums → tablas → índices → trigger updated_at → RLS
-- Se puede volver a ejecutar borrando primero (ver bloque RESET
-- comentado al final del archivo).
-- ================================================================


-- ================================================================
-- 1 · ENUMS  (sets cerrados: modular pero no caótico)
-- ================================================================

create type categoria as enum (
  'estudio',
  'proyecto',
  'postulaciones',
  'perros',
  'casa',
  'salud',
  'salidas',
  'otros'
);

create type grupo_racha as enum (
  'general',   -- estudio, proyecto, postulaciones, casa
  'personal'   -- salud, perros
);

create type tipo_dia as enum (
  'A_cocina',
  'B_gym',
  'B_libre',
  'roto'
);

create type estado_postulacion as enum (
  'enviada',
  'respondida',
  'entrevista',
  'prueba',
  'oferta',
  'rechazada',
  'sin_respuesta'
);


-- ================================================================
-- 2 · SETTINGS  (una fila por usuario · metas y umbrales)
-- ================================================================
-- Los umbrales viven acá y NO en el código: si mañana quieres
-- exigirte 75% en vez de 70%, cambias un número en la base.

create table settings (
  user_id                  uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id         text,
  hora_inicio              time not null default '09:30',
  hora_fin                 time not null default '23:00',
  meta_postulaciones_sem   int  not null default 15,
  meta_gym_sem             int  not null default 3,
  min_gym_sem              int  not null default 2,
  umbral_cumplida          numeric(3,2) not null default 0.70,
  umbral_parcial           numeric(3,2) not null default 0.50,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);


-- ================================================================
-- 3 · TEMPLATES  (los 4 tipos de día)
-- ================================================================

create table templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tipo         tipo_dia not null,
  nombre       text not null,
  descripcion  text,
  activa       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (user_id, tipo)
);


-- ================================================================
-- 4 · TEMPLATE_TASKS  (las tareas de cada plantilla)
-- ================================================================
-- Editar acá afecta los días FUTUROS, nunca los pasados.
-- Ese es el corazón de la modularidad: mover el inglés de 19:30
-- a 21:00 es un UPDATE, no un cambio de código.

create table template_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  uuid not null references templates(id) on delete cascade,
  titulo       text not null,
  categoria    categoria not null,
  grupo        grupo_racha not null default 'general',
  hora         time,                       -- null = sin hora fija
  duracion_min int,
  orden        int not null default 0,
  peso         numeric(4,2) not null default 1,
  es_minimo    boolean not null default false,  -- cuenta para "mínimo viable"
  aviso_min    int default 5,              -- min antes del aviso; null = sin aviso
  activa       boolean not null default true,
  created_at   timestamptz not null default now()
);


-- ================================================================
-- 5 · DAYS  (un registro por día vivido)
-- ================================================================

create table days (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  fecha        date not null,
  tipo         tipo_dia not null,
  template_id  uuid references templates(id) on delete set null,
  es_roto      boolean not null default false,  -- excluido del cálculo semanal
  nota         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, fecha)
);


-- ================================================================
-- 6 · DAY_TASKS  (el checklist real del día)
-- ================================================================
-- Se genera copiando template_tasks. Copia, no referencia:
-- así el historial queda congelado aunque cambies la plantilla.

create table day_tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  day_id            uuid not null references days(id) on delete cascade,
  template_task_id  uuid references template_tasks(id) on delete set null,
  titulo            text not null,
  categoria         categoria not null,
  grupo             grupo_racha not null default 'general',
  hora              time,          -- editable: "hoy salgo 12:50 al gym"
  duracion_min      int,
  orden             int not null default 0,
  peso              numeric(4,2) not null default 1,
  es_minimo         boolean not null default false,
  aviso_min         int,
  hecha             boolean not null default false,
  hecha_at          timestamptz,
  avisada           boolean not null default false,  -- para que el bot no repita
  created_at        timestamptz not null default now()
);


-- ================================================================
-- 7 · EVENTS  (lo variable: reuniones, veterinario, citas médicas)
-- ================================================================

create table events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  titulo       text not null,
  categoria    categoria not null default 'otros',
  fecha        date not null,
  hora         time,
  duracion_min int,
  nota         text,
  bloquea_dia  boolean not null default false,  -- true → marca el día como roto
  created_at   timestamptz not null default now()
);


-- ================================================================
-- 8 · COURSES
-- ================================================================

create table courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  plataforma  text,
  url         text,
  progreso    int not null default 0 check (progreso between 0 and 100),
  prioridad   int not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- ================================================================
-- 9 · APPLICATIONS
-- ================================================================

create table applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  empresa     text not null,
  cargo       text,
  fuente      text,          -- LinkedIn, elempleo, Get on Board...
  url         text,
  fecha       date not null default current_date,
  estado      estado_postulacion not null default 'enviada',
  nota        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- ================================================================
-- 10 · WEEK_STATS  (cierre semanal · rachas)
-- ================================================================

create table week_stats (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  semana_inicio    date not null,          -- siempre lunes
  pct_general      numeric(4,3),
  pct_personal     numeric(4,3),
  estado_general   text check (estado_general in ('cumplida','parcial','rota')),
  estado_personal  text check (estado_personal in ('cumplida','parcial','rota')),
  racha_general    int not null default 0,
  racha_personal   int not null default 0,
  gym_hechos       int not null default 0,
  postulaciones    int not null default 0,
  dias_rotos       int not null default 0,
  cerrada          boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (user_id, semana_inicio)
);


-- ================================================================
-- 11 · ÍNDICES
-- ================================================================

create index idx_template_tasks_template on template_tasks (template_id, orden);
create index idx_days_user_fecha         on days (user_id, fecha desc);
create index idx_day_tasks_day           on day_tasks (day_id, orden);
create index idx_day_tasks_pendientes    on day_tasks (user_id, hecha) where hecha = false;
create index idx_events_user_fecha       on events (user_id, fecha);
create index idx_applications_user_fecha on applications (user_id, fecha desc);
create index idx_week_stats_user_semana  on week_stats (user_id, semana_inicio desc);


-- ================================================================
-- 12 · TRIGGER updated_at
-- ================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_settings_updated
  before update on settings
  for each row execute function set_updated_at();

create trigger trg_days_updated
  before update on days
  for each row execute function set_updated_at();

create trigger trg_courses_updated
  before update on courses
  for each row execute function set_updated_at();

create trigger trg_applications_updated
  before update on applications
  for each row execute function set_updated_at();


-- ================================================================
-- 13 · ROW LEVEL SECURITY
-- ================================================================
-- ESTO es lo que protege tus datos con el repo público.
-- Sin estas políticas, cualquiera con la anon key (que es pública
-- por diseño) podría leer todo. Con ellas, la base solo devuelve
-- filas donde user_id coincide con quien hizo login.

alter table settings      enable row level security;
alter table templates     enable row level security;
alter table template_tasks enable row level security;
alter table days          enable row level security;
alter table day_tasks     enable row level security;
alter table events        enable row level security;
alter table courses       enable row level security;
alter table applications  enable row level security;
alter table week_stats    enable row level security;

create policy "settings propias" on settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "templates propias" on templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "template_tasks propias" on template_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "days propios" on days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "day_tasks propias" on day_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "events propios" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "courses propios" on courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "applications propias" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "week_stats propias" on week_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ================================================================
-- LISTO · Fase 1.5 completa
-- ================================================================
-- Verificación rápida (debe devolver 9 filas, todas con rls = true):
--
--   select tablename, rowsecurity as rls
--   from pg_tables
--   where schemaname = 'public'
--   order by tablename;
--
-- ================================================================


-- ================================================================
-- RESET · solo si necesitas volver a empezar de cero
-- ================================================================
-- Descomenta y ejecuta SOLO este bloque. Borra TODO.
--
-- drop table if exists week_stats, applications, courses, events,
--   day_tasks, days, template_tasks, templates, settings cascade;
-- drop function if exists set_updated_at() cascade;
-- drop type if exists estado_postulacion, tipo_dia, grupo_racha, categoria cascade;
-- ================================================================