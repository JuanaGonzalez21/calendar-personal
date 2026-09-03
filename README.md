# Mi día

Organizador diario personal hecho a medida: seguimiento de tareas por tipo de día,
pagos, agenda con calendario, cursos y postulaciones — todo en una PWA instalable que
manda notificaciones push. Construida para una sola usuaria (yo), optimizada para que
motive en vez de regañar.

> No es otra app de tareas genérica: está diseñada alrededor de cómo funciona mi día real
> (días tipo, "mínimo viable" para los días difíciles, y un marcador de esfuerzo que
> celebra los días que sí me moví).

## ✨ Características

- **Hoy** — checklist del día generado desde plantillas, con progreso ponderado y un
  "mínimo viable" para no romper la racha en días difíciles.
- **Plantillas de día** — tipos de día (cocina, gym, libre, roto) editables desde la app,
  sin tocar la base de datos.
- **Pagos** — pagos fijos, suscripciones y pendientes puntuales, con fechas de
  vencimiento y marcado de pagado (los recurrentes se reinician solos cada mes).
- **Agenda** — calendario mensual de eventos (citas médicas, entrevistas, reuniones,
  salidas, conciertos) con un marcador de esfuerzo 🔥 por día, derivado de las tareas
  completadas. Solo celebra el esfuerzo; nunca marca un día como fracaso.
- **Cursos** — seguimiento de tiempo de estudio por curso.
- **Postulaciones** — tracker de búsqueda de empleo con exportación a CSV.
- **Notificaciones push** — recordatorios de tareas, eventos y pagos que llegan al
  celular, disparados por un cron externo.
- **PWA instalable** — se agrega a la pantalla de inicio del iPhone y corre a pantalla
  completa.

## 🛠️ Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Estilos:** Tailwind CSS
- **Backend / BD:** Supabase (Postgres + Auth) con Row Level Security
- **Notificaciones:** Web Push (Service Worker + VAPID) vía `web-push`
- **Scheduler:** endpoint protegido invocado por un cron externo (cron-job.org)
- **Deploy:** Vercel

## 🚀 Puesta en marcha

### Requisitos

- Node.js y npm
- Un proyecto de Supabase
- Llaves VAPID (para las notificaciones): `npx web-push generate-vapid-keys`

### Variables de entorno

Crea un `.env.local` (y replícalas en Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # solo servidor (nunca en el cliente)
ALLOWED_EMAIL=...                    # allowlist de acceso

NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tucorreo@ejemplo.com

NOTIF_CRON_SECRET=...                # protege el endpoint del scheduler
```

### Base de datos

Corre los scripts de la carpeta `sql/` en el SQL Editor de Supabase (esquema, seed y las
migraciones de pagos, notificaciones y agenda).

### Local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

### Notificaciones (producción)

1. Configura las variables VAPID + `SUPABASE_SERVICE_ROLE_KEY` + `NOTIF_CRON_SECRET` en Vercel y redespliega.
2. En la app instalada: Ajustes → Notificaciones → **Activar** → **Enviar prueba**.
3. Conecta un cron externo (p. ej. cron-job.org) que haga `POST` cada 15 min a
   `/api/notificaciones/cron` con el header `Authorization: Bearer <NOTIF_CRON_SECRET>`.

## 🏗️ Arquitectura

- **Generación del día:** al abrir un día, se copian las tareas de su plantilla
  (`template_tasks` → `day_tasks`). Editar una plantilla solo afecta los días futuros;
  los días pasados quedan congelados.
- **Marcador de esfuerzo:** se calcula por día desde `day_tasks` (completitud ponderada y
  "mínimo viable"). Es solo positivo, por diseño.
- **Scheduler de notificaciones:** un endpoint (`/api/notificaciones/cron`) protegido por
  secreto revisa qué tareas/eventos/pagos toca avisar en horario Bogotá y envía el push,
  con anti-repetición vía una tabla de registro.

## 📝 Notas

- Zona horaria: todo se calcula en horario de Bogotá (GMT-5).
- App de un solo usuario, con acceso por allowlist.

---

Hecho con ganas de tener algo *mío*, no una suscripción más. 🍋

