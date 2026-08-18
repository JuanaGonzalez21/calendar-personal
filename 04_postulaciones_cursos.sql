-- ================================================================
-- MI DÍA · Fase 2B — Migración
-- ================================================================
-- 1. Rehace `applications` con fase + estado separados
-- 2. Agrega `course_sessions` para registrar tiempo de estudio
--
-- La tabla applications se borra y se recrea: está vacía, no hay
-- nada que perder.
-- ================================================================


-- ================================================================
-- 1 · POSTULACIONES
-- ================================================================

drop table if exists applications cascade;
drop type if exists estado_postulacion cascade;

-- En qué punto del proceso va
create type fase_postulacion as enum (
  'entregada',        -- entregada hoja de vida
  'entrevista_rrhh',
  'prueba_tecnica',
  'propuesta'         -- propuesta laboral
);

-- Si sigue viva o no
create type estado_proceso as enum (
  'en_proceso',
  'cerrada',
  'sin_respuesta'
);

create table applications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  empresa            text not null,
  cargo              text,
  fuente             text,          -- LinkedIn, elempleo, Get on Board…
  url                text,
  fecha              date not null default current_date,
  fase               fase_postulacion not null default 'entregada',
  estado             estado_proceso   not null default 'en_proceso',
  -- Última vez que pasó algo. Si lleva 14 días quieta, la app la
  -- muestra como "sin respuesta" sin necesidad de un cron.
  ultimo_movimiento  date not null default current_date,
  nota               text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_applications_user_fecha
  on applications (user_id, fecha desc);

alter table applications enable row level security;

create policy "applications propias" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger trg_applications_updated
  before update on applications
  for each row execute function set_updated_at();


-- ================================================================
-- 2 · SESIONES DE ESTUDIO
-- ================================================================
-- En vez de "¿en qué % voy?", registras "hoy estudié 50 min".
-- Es un dato que sabes al terminar, sin ir a revisar la plataforma.

create table course_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  fecha       date not null default current_date,
  minutos     int  not null check (minutos > 0),
  created_at  timestamptz not null default now()
);

create index idx_course_sessions_curso
  on course_sessions (course_id, fecha desc);

create index idx_course_sessions_user_fecha
  on course_sessions (user_id, fecha desc);

alter table course_sessions enable row level security;

create policy "sesiones propias" on course_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ================================================================
-- VERIFICACIÓN
-- ================================================================
--   select count(*) from applications;      -- 0
--   select count(*) from course_sessions;   -- 0
--   select nombre from courses order by prioridad;  -- tus 5 cursos
-- ================================================================
