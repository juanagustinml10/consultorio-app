# Consultorio Médico — Sistema de gestión

Plataforma web para un consultorio médico:

- **Página pública** del profesional (pacientes, sin login).
- **Sistema privado**: paneles para el **médico** (`/medico`) y la **secretaría** (`/secretaria`).

> **Estado**: Etapa 1 completada — base visual y arquitectónica. Todas las pantallas usan
> **datos ficticios de ejemplo** y **no** hay conexión a la base de datos todavía.

## Estructura

```
consultorio-app/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS v4
│   └── src/
│       ├── components/
│       │   ├── public/     # Secciones del sitio público
│       │   ├── dashboard/  # Tarjetas, listas de espera, actividad
│       │   └── ui/         # Primitivas reutilizables (Card, EstadoBadge)
│       ├── data/           # Datos de ejemplo (mock) — se reemplazan por la API
│       ├── layouts/        # DashboardLayout (sidebar + header responsive)
│       ├── lib/            # Cliente HTTP preparado para la API
│       ├── pages/          # Publica, Login, MedicoPanel, SecretariaPanel, etc.
│       └── types/          # Tipos del dominio (alineados con el esquema de Prisma)
└── backend/           # Express + TypeScript + Prisma + Zod
    ├── prisma/             # schema.prisma (modelos: Usuario, Paciente, Turno, Aviso…)
    └── src/
        ├── routes/         # auth, pacientes, turnos, sitio (501: pendientes)
        ├── src/validations # esquemas Zod listos para la etapa 2
        └── lib/prisma.ts   # cliente Prisma (se activa con DATABASE_URL)
```

## Cómo ejecutar (desarrollo)

```bash
# Terminal 1 — API (http://localhost:3001)
cd backend
npm install
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

El frontend hace proxy de `/api/*` hacia el backend (`vite.config.ts`).

> Para despliegue en producción (Vercel/Supabase o Cloudflare Workers) ver
> [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Rutas

| Ruta                  | Página                                  |
| --------------------- | --------------------------------------- |
| `/`                   | Página pública del médico               |
| `/login`              | Inicio de sesión (validación visual)    |
| `/medico`             | Panel del médico                        |
| `/medico/pacientes`   | Pendiente (etapa 2)                     |
| `/medico/historias`   | Pendiente (etapa 2)                     |
| `/medico/agenda`      | Agenda semanal visual (datos ejemplo)   |
| `/secretaria`         | Panel de recepción                      |
| `/secretaria/llegadas`| Pendiente (etapa 2)                     |
| `/secretaria/agenda`  | Agenda semanal visual (datos ejemplo)   |

## Etapa 2 (pendiente)

1. Crear base PostgreSQL local (o Neon) y completar `backend/.env` (copiar `.env.example`).
2. `npx prisma migrate dev --name inicial` y `npm run prisma:generate`.
3. Autenticación real (JWT + roles) en `backend/src/routes/auth.ts`.
4. CRUD de pacientes y turnos + flujo de estados (PROGRAMADO → LLEGO → EN_ATENCION → ATENDIDO).
5. Reemplazar `frontend/src/data/mock.ts` por servicios que consuman `/api`.
