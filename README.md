# StoryFlop

![StoryFlop](public/og.png)

**Scrum Poker en tiempo real para equipos ágiles.**

StoryFlop permite preparar historias, estimarlas de forma colaborativa y alcanzar consenso en una mesa compartida. No requiere registro: cada participante entra mediante un enlace, elige un avatar y puede votar u observar cada ronda.

## Funcionalidades

- Salas privadas mediante códigos de invitación no secuenciales.
- Votación privada hasta que el organizador revela las cartas.
- Participantes votantes u observadores, configurables en cada ronda.
- Sincronización en tiempo real de miembros, tareas, votos y reacciones.
- Backlog editable con título, descripción, URL y orden personalizado.
- Histórico de rondas y cambios de estimación por tarea.
- Resultados con media, mediana, distribución y detección de consenso.
- Reacciones rápidas entre participantes.
- Identidad anónima persistente y avatares predefinidos.
- Interfaz responsive y accesible.
- Español, inglés, alemán, portugués, catalán y euskera.

## Tecnologías

- [Next.js](https://nextjs.org/) y React
- TypeScript
- [Supabase](https://supabase.com/) Auth, PostgreSQL y Realtime
- TanStack Query
- next-intl
- Vitest y Playwright

## Requisitos

- Node.js 22.13 o superior
- pnpm
- Un proyecto de Supabase
- Supabase CLI para aplicar las migraciones

## Instalación local

```bash
git clone https://github.com/jbonet89/StoryFlop.git
cd StoryFlop
pnpm install
cp .env.example .env.local
```

Configura `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_ANON
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Activa **Anonymous Sign-Ins** en **Supabase → Authentication → Providers**. Después vincula el proyecto y aplica el esquema:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Inicia la aplicación:

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

> No expongas una `SUPABASE_SERVICE_ROLE_KEY` en el navegador ni uses el prefijo `NEXT_PUBLIC_` para claves privadas.

## Comprobaciones

```bash
pnpm lint
pnpm typecheck
pnpm i18n:validate
pnpm test
pnpm build
```

Las pruebas E2E multiusuario requieren un proyecto Supabase de pruebas configurado en `.env.local`:

```bash
RUN_SUPABASE_E2E=1 pnpm test:e2e
```

No ejecutes las pruebas E2E contra datos de producción.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Mantén el preset de Next.js y `pnpm build` como comando de construcción.
3. Configura las tres variables públicas mostradas anteriormente.
4. Cambia `NEXT_PUBLIC_SITE_URL` por la URL pública de la aplicación.
5. Añade las URL de producción y preview a las URL permitidas en Supabase.
6. Aplica cualquier migración pendiente con `supabase db push`.

## Arquitectura

```text
app/                      Rutas, estilos y proveedores globales
components/               Componentes compartidos
features/rooms/           Acceso a salas, estado y Realtime
features/room/components/ Mesa, jugadores, tareas, votos y resultados
i18n/ y messages/         Configuración y catálogos de idiomas
lib/                      Tipos, validaciones y lógica de dominio
supabase/migrations/      Esquema, RLS y funciones transaccionales
tests/ y e2e/             Pruebas unitarias y de navegador
```

Las escrituras sensibles se realizan mediante funciones PostgreSQL `SECURITY DEFINER` que obtienen la identidad desde `auth.uid()`. Las políticas RLS impiden consultar los votos de otros participantes antes de revelar una ronda.

## Privacidad y mantenimiento

StoryFlop utiliza autenticación anónima de Supabase. Los datos de las salas permanecen en el proyecto configurado por quien despliega la aplicación. Las reacciones son eventos efímeros; se recomienda programar una limpieza periódica:

```sql
delete from public.reactions
where created_at < now() - interval '24 hours';
```

## Estado del proyecto

El proyecto está en desarrollo activo. Antes de utilizarlo en producción, revisa las políticas de conservación de datos, límites de Supabase y disponibilidad legal del nombre de marca para tu jurisdicción.
