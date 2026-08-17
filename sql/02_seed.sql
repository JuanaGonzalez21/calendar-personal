select t.tipo, t.nombre, count(tt.id) as tareas
from templates t
left join template_tasks tt on tt.template_id = t.id
group by t.tipo, t.nombre
order by t.tipo;

-- ================================================================
-- MI DÍA · Fase 1.7 — Seed inicial
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ================================================================
-- Inserta: settings + 4 plantillas + sus tareas + cursos activos.
--
-- OJO: el UUID de abajo es TU user_id. Si algún día borras el
-- usuario y creas otro, hay que reemplazarlo en todo el archivo.
--   user_id actual: 923e920f-423c-4461-a848-f6120fca04c7
-- ================================================================


-- ================================================================
-- 1 · SETTINGS
-- ================================================================

insert into settings (
  user_id, hora_inicio, hora_fin,
  meta_postulaciones_sem, meta_gym_sem, min_gym_sem,
  umbral_cumplida, umbral_parcial
) values (
  '923e920f-423c-4461-a848-f6120fca04c7',
  '09:30', '23:00',
  15, 3, 2,
  0.70, 0.50
)
on conflict (user_id) do nothing;


-- ================================================================
-- 2 · PLANTILLAS
-- ================================================================

insert into templates (user_id, tipo, nombre, descripcion) values
  ('923e920f-423c-4461-a848-f6120fca04c7', 'A_cocina',
   'Día A · Cocina',
   'Cocino desayuno, almuerzo y cena para 4 + entrego cocina impecable. Sin gym.'),

  ('923e920f-423c-4461-a848-f6120fca04c7', 'B_gym',
   'Día B · Gym',
   'Día ligero con 2h de gimnasio. La ducha va después del gym, sin decidirlo.'),

  ('923e920f-423c-4461-a848-f6120fca04c7', 'B_libre',
   'Día B · Libre',
   'Sin cocina ni gym. Se abre el Bloque 3 para proyecto.'),

  ('923e920f-423c-4461-a848-f6120fca04c7', 'roto',
   'Día roto',
   'Cita médica o imprevisto. Solo mínimo viable. No cuenta en el cálculo semanal.')
on conflict (user_id, tipo) do nothing;


-- ================================================================
-- 3 · TAREAS · DÍA A (COCINA)
-- ================================================================

insert into template_tasks
  (user_id, template_id, titulo, categoria, grupo, hora,
   duracion_min, orden, peso, es_minimo, aviso_min)
select
  '923e920f-423c-4461-a848-f6120fca04c7',
  t.id, v.titulo, v.categoria::categoria, v.grupo::grupo_racha,
  v.hora::time, v.duracion_min, v.orden, v.peso, v.es_minimo, v.aviso_min
from templates t
cross join (values
  ('Perros · salida + comida',        'perros',        'personal', '09:30', 30,   1, 1.0, true,  0),
  ('Desayuno',                        'casa',          'personal', '10:00', 45,   2, 0.0, false, null),
  ('Ducha',                           'salud',         'personal', '10:45', 20,   3, 1.0, false, null),
  ('Sertralina',                      'salud',         'personal', '11:00', null, 4, 1.0, true,  0),
  ('Bloque 1 · Estudio o proyecto',   'estudio',       'general',  '11:00', 120,  5, 2.0, true,  5),
  ('Bellaface',                       'salud',         'personal', '13:00', null, 6, 1.0, true,  0),
  ('Cocinar · 3 comidas para 4',      'casa',          'general',  '13:00', 150,  7, 2.0, false, 10),
  ('Entregar cocina impecable',       'casa',          'general',  '15:30', 60,   8, 1.0, false, null),
  ('Bloque 2 · 3 postulaciones',      'postulaciones', 'general',  '16:30', 90,   9, 2.0, true,  5),
  ('Perros · salida + comida',        'perros',        'personal', '18:00', 30,  10, 1.0, true,  0),
  ('Cena',                            'casa',          'personal', '18:30', 60,  11, 0.0, false, null),
  ('Inglés · 20 min',                 'estudio',       'general',  '19:30', 20,  12, 1.0, false, 5),
  ('Dientes noche',                   'salud',         'personal', '21:30', null,13, 1.0, false, null)
) as v(titulo, categoria, grupo, hora, duracion_min, orden, peso, es_minimo, aviso_min)
where t.user_id = '923e920f-423c-4461-a848-f6120fca04c7'
  and t.tipo = 'A_cocina';


-- ================================================================
-- 4 · TAREAS · DÍA B (GYM)
-- ================================================================

insert into template_tasks
  (user_id, template_id, titulo, categoria, grupo, hora,
   duracion_min, orden, peso, es_minimo, aviso_min)
select
  '923e920f-423c-4461-a848-f6120fca04c7',
  t.id, v.titulo, v.categoria::categoria, v.grupo::grupo_racha,
  v.hora::time, v.duracion_min, v.orden, v.peso, v.es_minimo, v.aviso_min
from templates t
cross join (values
  ('Perros · salida + comida',      'perros',        'personal', '09:30', 30,   1, 1.0, true,  0),
  ('Desayuno',                      'casa',          'personal', '10:00', 45,   2, 0.0, false, null),
  ('Sertralina',                    'salud',         'personal', '11:00', null, 3, 1.0, true,  0),
  ('Bloque 1 · Estudio o proyecto', 'estudio',       'general',  '11:00', 120,  4, 2.0, true,  5),
  ('Bellaface',                     'salud',         'personal', '13:00', null, 5, 1.0, true,  0),
  ('Almuerzo',                      'casa',          'personal', '13:00', 45,   6, 0.0, false, null),
  ('Gimnasio',                      'salud',         'personal', '14:00', 120,  7, 2.0, false, 15),
  ('Ducha',                         'salud',         'personal', '16:00', 25,   8, 1.0, false, null),
  ('Bloque 2 · 3 postulaciones',    'postulaciones', 'general',  '16:30', 90,   9, 2.0, true,  5),
  ('Perros · salida + comida',      'perros',        'personal', '18:00', 30,  10, 1.0, true,  0),
  ('Cena',                          'casa',          'personal', '18:30', 60,  11, 0.0, false, null),
  ('Inglés · 20 min',               'estudio',       'general',  '19:30', 20,  12, 1.0, false, 5),
  ('Dientes noche',                 'salud',         'personal', '21:30', null,13, 1.0, false, null)
) as v(titulo, categoria, grupo, hora, duracion_min, orden, peso, es_minimo, aviso_min)
where t.user_id = '923e920f-423c-4461-a848-f6120fca04c7'
  and t.tipo = 'B_gym';


-- ================================================================
-- 5 · TAREAS · DÍA B (LIBRE)
-- ================================================================

insert into template_tasks
  (user_id, template_id, titulo, categoria, grupo, hora,
   duracion_min, orden, peso, es_minimo, aviso_min)
select
  '923e920f-423c-4461-a848-f6120fca04c7',
  t.id, v.titulo, v.categoria::categoria, v.grupo::grupo_racha,
  v.hora::time, v.duracion_min, v.orden, v.peso, v.es_minimo, v.aviso_min
from templates t
cross join (values
  ('Perros · salida + comida',      'perros',        'personal', '09:30', 30,   1, 1.0, true,  0),
  ('Desayuno',                      'casa',          'personal', '10:00', 45,   2, 0.0, false, null),
  ('Sertralina',                    'salud',         'personal', '11:00', null, 3, 1.0, true,  0),
  ('Bloque 1 · Estudio o proyecto', 'estudio',       'general',  '11:00', 120,  4, 2.0, true,  5),
  ('Bellaface',                     'salud',         'personal', '13:00', null, 5, 1.0, true,  0),
  ('Almuerzo',                      'casa',          'personal', '13:00', 45,   6, 0.0, false, null),
  ('Bloque 2 · 3 postulaciones',    'postulaciones', 'general',  '14:00', 90,   7, 2.0, true,  5),
  ('Casa · aseo o mandados',        'casa',          'general',  '15:30', 60,   8, 1.0, false, null),
  ('Bloque 3 · Proyecto',           'proyecto',      'general',  '16:30', 120,  9, 2.0, false, 5),
  ('Perros · salida + comida',      'perros',        'personal', '18:30', 30,  10, 1.0, true,  0),
  ('Cena',                          'casa',          'personal', '19:00', 60,  11, 0.0, false, null),
  ('Inglés · 20 min',               'estudio',       'general',  '19:30', 20,  12, 1.0, false, 5),
  ('Dientes noche',                 'salud',         'personal', '21:30', null,13, 1.0, false, null)
) as v(titulo, categoria, grupo, hora, duracion_min, orden, peso, es_minimo, aviso_min)
where t.user_id = '923e920f-423c-4461-a848-f6120fca04c7'
  and t.tipo = 'B_libre';


-- ================================================================
-- 6 · TAREAS · DÍA ROTO
-- ================================================================
-- Solo el mínimo viable. Este día NO entra en el cálculo semanal,
-- pero las anclas de salud siguen ahí porque no dependen del ánimo.

insert into template_tasks
  (user_id, template_id, titulo, categoria, grupo, hora,
   duracion_min, orden, peso, es_minimo, aviso_min)
select
  '923e920f-423c-4461-a848-f6120fca04c7',
  t.id, v.titulo, v.categoria::categoria, v.grupo::grupo_racha,
  v.hora::time, v.duracion_min, v.orden, v.peso, v.es_minimo, v.aviso_min
from templates t
cross join (values
  ('Perros · salida + comida',   'perros',        'personal', '09:30', 30,   1, 1.0, true, 0),
  ('Sertralina',                 'salud',         'personal', '11:00', null, 2, 1.0, true, 0),
  ('Bellaface',                  'salud',         'personal', '13:00', null, 3, 1.0, true, 0),
  ('1 pomodoro · 50 min',        'estudio',       'general',  null,    50,   4, 1.0, true, null),
  ('1 postulación',              'postulaciones', 'general',  null,    15,   5, 1.0, true, null),
  ('Perros · salida + comida',   'perros',        'personal', '18:30', 30,   6, 1.0, true, 0),
  ('Dientes noche',              'salud',         'personal', '21:30', null, 7, 1.0, false, null)
) as v(titulo, categoria, grupo, hora, duracion_min, orden, peso, es_minimo, aviso_min)
where t.user_id = '923e920f-423c-4461-a848-f6120fca04c7'
  and t.tipo = 'roto';


-- ================================================================
-- 7 · CURSOS ACTIVOS
-- ================================================================
-- Solo los 4 que sí vas a terminar + inglés.
-- PHP, Java y Lógica quedan fuera a propósito.

insert into courses (user_id, nombre, plataforma, progreso, prioridad, activo) values
  ('923e920f-423c-4461-a848-f6120fca04c7',
   'Universidad JavaScript · De Cero a Experto', 'Udemy', 73, 1, true),

  ('923e920f-423c-4461-a848-f6120fca04c7',
   'React · Guía definitiva (Nicolas Schurmann)', 'Udemy', 5, 2, true),

  ('923e920f-423c-4461-a848-f6120fca04c7',
   'Introducción a Figma 2026', 'Udemy', 25, 3, true),

  ('923e920f-423c-4461-a848-f6120fca04c7',
   'Git y GitHub para principiantes', 'Udemy', 50, 4, true),

  ('923e920f-423c-4461-a848-f6120fca04c7',
   'Inglés · A2 → B1', 'Udemy', 1, 5, true);


-- ================================================================
-- VERIFICACIÓN
-- ================================================================
-- Debe devolver 4 filas: A_cocina 13, B_gym 13, B_libre 13, roto 7
--
--   select t.tipo, t.nombre, count(tt.id) as tareas
--   from templates t
--   left join template_tasks tt on tt.template_id = t.id
--   group by t.tipo, t.nombre
--   order by t.tipo;
--
-- ================================================================


-- ================================================================
-- RESET DEL SEED · si necesitas volver a correrlo
-- ================================================================
-- delete from template_tasks
--   where user_id = '923e920f-423c-4461-a848-f6120fca04c7';
-- delete from templates
--   where user_id = '923e920f-423c-4461-a848-f6120fca04c7';
-- delete from courses
--   where user_id = '923e920f-423c-4461-a848-f6120fca04c7';
-- ================================================================
