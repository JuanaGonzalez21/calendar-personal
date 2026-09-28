-- ================================================================
-- MI DÍA · Fase 1.8 — Elimina el tipo de día "roto"/"normal" y
-- agrega la secuencia de rotación configurable.
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ================================================================
-- Requisito: ya corriste manualmente
--   alter type tipo_dia rename value 'roto' to 'normal';
--   update templates set nombre = 'Día normal' where tipo = 'normal';
-- Este script asume que el enum tiene ahora mismo estos 4 valores:
--   'A_cocina', 'B_gym', 'B_libre', 'normal'
-- y deja solo 3: 'A_cocina', 'B_gym', 'B_libre'.
-- ================================================================


-- ================================================================
-- 1 · Reasigna días históricos con tipo 'normal'
-- ================================================================
-- Se mueven a B_libre. Su columna es_roto NO se toca: si ya estaban
-- marcados como excluidos del cálculo semanal, lo siguen estando.

update days set tipo = 'B_libre' where tipo = 'normal';


-- ================================================================
-- 2 · Borra la plantilla del tipo eliminado
-- ================================================================
-- template_tasks se borra en cascada (FK on delete cascade).
-- days.template_id es on delete set null, así que los días ya
-- generados no se rompen.

delete from templates where tipo = 'normal';


-- ================================================================
-- 3 · Recrea el enum sin 'normal'
-- ================================================================
-- Postgres no permite DROP VALUE en un enum: hay que recrear el tipo.

alter type tipo_dia rename to tipo_dia_old;

create type tipo_dia as enum ('A_cocina', 'B_gym', 'B_libre');

alter table templates
  alter column tipo type tipo_dia using tipo::text::tipo_dia;

alter table days
  alter column tipo type tipo_dia using tipo::text::tipo_dia;

drop type tipo_dia_old;


-- ================================================================
-- 4 · Nombres visibles iniciales (editables luego desde
--     Ajustes → Plantillas, sin volver a tocar SQL)
-- ================================================================

update templates set nombre = 'Cocina'   where tipo = 'A_cocina';
update templates set nombre = 'Gimnasio' where tipo = 'B_gym';
update templates set nombre = 'Estudio'  where tipo = 'B_libre';


-- ================================================================
-- 5 · Secuencia de rotación configurable
-- ================================================================
-- secuencia_tipos: el orden de los pasos (se permiten repetidos).
-- secuencia_ancla: la fecha desde la que se cuenta el ciclo; se
-- resetea a hoy cada vez que se guarda una secuencia nueva desde
-- la app, así "hoy toca el primer paso" siempre se cumple.

alter table settings
  add column secuencia_tipos tipo_dia[] not null
    default array['B_libre', 'B_gym', 'A_cocina']::tipo_dia[],
  add column secuencia_ancla date not null default current_date;


-- ================================================================
-- VERIFICACIÓN
-- ================================================================
-- Debe devolver 3 filas (A_cocina, B_gym, B_libre) con sus nombres
-- nuevos, y la secuencia/ancla del usuario:
--
--   select tipo, nombre from templates order by tipo;
--   select user_id, secuencia_tipos, secuencia_ancla from settings;
-- ================================================================
