# StoryFlop

StoryFlop es una aplicación de Scrum Poker internacionalizada para equipos ágiles y remotos. Permite estimar historias de usuario y story points en tiempo real con Next.js, React, TypeScript, `next-intl` y Supabase para autenticación anónima, persistencia, seguridad RLS y sincronización Realtime.

**Descriptor:** Scrum Poker para equipos ágiles.

**Claim:** Pon cada historia sobre la mesa, revela las cartas y alcanza el consenso.

## Identidad de marca

StoryFlop une *Story* —la historia de usuario que se estima— con *flop* en su sentido de póker: el momento en que se revelan cartas sobre la mesa. La comunicación y el producto refuerzan siempre el contexto de estimación colaborativa; no presentan el nombre como fracaso ni como una invitación a apostar.

El isotipo representa tres cartas reveladas dentro de un cuadrado coral. La carta central queda adelantada y construye una “F” geométrica reconocible incluso a 16 píxeles. No utiliza palos tradicionales, fichas, monedas, coronas, trofeos ni elementos de casino. La fuente vectorial original es `public/brand/storyflop-mark.svg`; `public/brand/storyflop-og.svg` contiene la composición social.

La paleta base es:

- Coral `#FF645A` y coral oscuro `#D94841`.
- Verde mesa `#075B46` y verde profundo `#043E31`.
- Crema `#F7F3EA`, blanco cálido `#FFFDF8` y amarillo `#F4B740`.

Reglas básicas de uso:

- Escribir siempre `StoryFlop`, sin traducirlo, separarlo ni cambiar las mayúsculas.
- Mantener el descriptor como texto HTML traducible; nunca convertirlo en trazados dentro del logotipo.
- Con texto visible, el isotipo es decorativo. Cuando aparece solo, su nombre accesible es `StoryFlop`.
- No añadir al símbolo palos de cartas, dinero, fichas ni recursos que lo acerquen a una aplicación de apuestas.

StoryFlop es el nombre de marca de la aplicación. “Scrum Poker” se utiliza como descriptor funcional.

El término “flop” se utiliza en su sentido de póker: el revelado de cartas sobre la mesa. La comunicación de marca debe reforzar el contexto de estimación colaborativa y evitar asociaciones con fracaso o apuestas.

No se afirma que la marca esté registrada. Antes de publicarla debe completarse la revisión de disponibilidad comercial, dominios y marcas correspondiente.

### Regenerar favicon e iconos

Los PNG, el ICO, `app/icon.svg` y la imagen Open Graph se regeneran desde los SVG fuente con Sharp:

```bash
pnpm brand:generate
pnpm brand:validate
```

El generador sobrescribe únicamente estos assets conocidos:

- `app/icon.svg` y `app/favicon.ico` —el ICO contiene 16, 32 y 48 píxeles.
- `public/icons/favicon-16x16.png` y `public/icons/favicon-32x32.png`.
- `public/icons/apple-touch-icon.png` de 180 × 180.
- `public/icons/icon-192.png` y `public/icons/icon-512.png`.
- `public/og.png` de 1200 × 630.

Para comprobar un cambio de favicon, reinicia el servidor y abre directamente `/favicon.ico`, `/icon.svg` y `/icons/favicon-32x32.png`. Si el navegador conserva el anterior, vacía la caché, prueba una ventana privada y elimina el sitio de favoritos antes de volverlo a añadir. Chrome y Safari almacenan estos recursos de forma especialmente agresiva.

Las traducciones de marca están bajo la clave `Brand` de los seis catálogos en `messages/`. Al modificar `tagline`, `claim` o `shortClaim`, conserva la misma estructura en todos los idiomas y ejecuta `pnpm i18n:validate`. `StoryFlop` debe permanecer idéntico.

## Funcionalidad

- Creación de salas con códigos aleatorios no secuenciales de 8 caracteres.
- Identidad anónima persistente y perfil específico por sala.
- Presence Realtime con soporte para varias pestañas y reconexión.
- Backlog de tareas, rondas sucesivas y estimación definitiva.
- Detalle local de tareas, edición de título/descripcion/URL y reordenación transaccional.
- Histórico por tarea con participación, media, mediana, distribución y ronda aceptada.
- Modo votante u observador independiente del rol de organizador, configurable por ronda.
- Votos privados protegidos por RLS hasta que el organizador revela la ronda.
- Distribución, media, mediana y consenso; `?` y `☕` no entran en los cálculos numéricos.
- Reacciones entre participantes validadas en PostgreSQL y limitadas por frecuencia.
- Interfaz adaptable y accesible, con reducción de movimiento.
- Interfaz disponible en español, inglés, alemán, portugués, catalán y euskera.

## Internacionalización

La aplicación usa `next-intl` con App Router y mantiene las rutas estables (`/` y `/sala/[code]`), sin prefijos de idioma. De este modo, una invitación compartida funciona para todos y cada participante puede ver la misma sala en su idioma.

El idioma se resuelve durante SSR en este orden:

1. Cookie `NEXT_LOCALE` establecida por el selector.
2. Cabecera `Accept-Language` del navegador, incluyendo variantes regionales como `pt-BR` o `de-AT`.
3. Español (`es`) como fallback.

La cookie dura un año, utiliza `SameSite=Lax`, `Path=/` y `Secure` en producción. El selector está en la página inicial, en la pantalla de entrada y en el menú de la sala. Al cambiarlo se usa `router.refresh()`: la URL, la sesión anónima, el voto, la sala y los canales Realtime se conservan. El atributo `lang` del documento se genera con el mismo idioma que la primera renderización, evitando cambios tardíos e hidrataciones inconsistentes.

Los catálogos están en `messages/es.json`, `messages/en.json`, `messages/de.json`, `messages/pt.json`, `messages/ca.json` y `messages/eu.json`. Solo se entrega al navegador el catálogo activo, combinado en el servidor con el fallback español. Fechas, horas y números se formatean con `Intl` usando el idioma activo; los plurales y mensajes con variables utilizan ICU.

Para añadir un idioma:

1. Añade el código a `supportedLocales` y su nombre nativo en `i18n/config.ts`.
2. Crea `messages/<codigo>.json` copiando exactamente la estructura de `messages/es.json`.
3. Traduce todos los valores sin modificar las claves ni el contenido colaborativo.
4. Ejecuta `pnpm i18n:validate`, `pnpm test` y `pnpm build`.

Para añadir una clave, créala primero en español y después en los otros cinco catálogos. La validación rechaza claves ausentes, adicionales o vacías.

Para simular la detección automática, elimina la cookie `NEXT_LOCALE`, cambia el idioma preferido del navegador y abre una ventana privada. Para eliminar una preferencia manual, borra esa misma cookie desde las herramientas del navegador.

### Comprobación manual de idiomas

1. Prueba sin cookie con el navegador en inglés, alemán, portugués, catalán y euskera.
2. Cambia de idioma dentro de una sala con una ronda activa y confirma que ruta, identidad, modo y voto se conservan.
3. Abre la misma sala en dos perfiles con idiomas diferentes y confirma que comparten datos, pero no textos de interfaz.
4. Comprueba alemán a 375, 768 y 1440 píxeles para detectar textos largos y scroll horizontal.

## Requisitos

- Node.js 22 o superior y pnpm.
- Un proyecto de Supabase.
- Supabase CLI si se quiere trabajar con la base de datos local.

## Instalación

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abre `http://localhost:3000`.

## Variables de entorno

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_ANON
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

No uses `SUPABASE_SERVICE_ROLE_KEY` en el navegador ni la añadas a variables que empiecen por `NEXT_PUBLIC_`.

## Configurar Supabase

1. Crea un proyecto y abre **Authentication → Providers → Anonymous Sign-Ins**.
2. Activa el acceso anónimo. La configuración local equivalente ya está en `supabase/config.toml`.
3. Vincula el proyecto y aplica la migración:

````bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

La migración inicial crea tablas, índices, restricciones, triggers, políticas RLS y las funciones RPC. La migración `20260803010000_realtime_and_reactions.sql` verifica de forma idempotente la publicación Realtime, configura `REPLICA IDENTITY FULL` y amplía los emojis permitidos. La migración `20260803020000_participation_modes.sql` añade la preferencia votante/observador, guarda un snapshot por ronda, protege `cast_vote` y crea el cambio de modo transaccional. La migración `20260803030000_task_management_and_history.sql` incorpora URL, ronda de aceptación, auditoría de estimaciones y las RPC seguras de edición, ordenación y corrección final. `20260803050000_leave_room_task_creator.sql` conserva las tareas cuando su creador abandona la sala y libera únicamente su referencia de miembro. Si el proyecto ya existía, vuelve a ejecutar `supabase db push` para aplicar las pendientes.

Si gestionas Realtime desde el panel, confirma en **Database → Publications → supabase_realtime** que `room_members`, `tasks`, `rounds`, `round_participation`, `votes`, `task_estimate_changes` y `reactions` estén activadas. Las migraciones hacen esta operación automáticamente sin fallar cuando una tabla ya está incluida. Presence no necesita una tabla: usa un canal efímero por sala.

La sala crea un canal estable de Postgres Changes por `room_id`, con listeners explícitos para cada tabla. Miembros, participaciones, votos y reacciones actualizan inmutablemente la caché concreta de TanStack Query; las tareas y rondas invalidan solo la sala activa. Al recibir `SUBSCRIBED` se realiza una única reconciliación para no perder eventos entre la carga inicial y la apertura del canal. Presence utiliza otro canal efímero y escucha `sync`, `join` y `leave`.

### Votantes y observadores

`room_members.default_participation_mode` guarda la preferencia para futuras rondas. Al iniciar o reiniciar una ronda, `round_participation.participation_mode` recibe una copia para cada miembro válido; ese snapshot se usa después en el histórico y no se sustituye por la preferencia actual.

Durante una ronda abierta, `set_my_participation_mode` actualiza en una sola transacción el snapshot y la preferencia. La identidad se obtiene de `auth.uid()`: el cliente no envía `member_id`. Al pasar a observador, la misma transacción elimina el voto y limpia `has_voted` y `voted_at`. Una ronda revelada no se modifica; el cambio solo prepara la siguiente.

`cast_vote` bloquea y valida la ronda y exige que la fila del usuario en `round_participation` sea `voter`; una llamada directa de un observador se rechaza con `OBSERVER_CANNOT_VOTE`. El navegador sigue teniendo únicamente `SELECT` sobre las tablas. Los contadores y resultados filtran por el snapshot de votantes, por lo que los observadores no cuentan como pendientes ni entran en media, mediana, distribución o consenso. Presence continúa representando solo conexión y nunca cambia el modo de participación.

### Gestión y detalle de tareas

La tarea activa de la ronda se deriva exclusivamente de `rounds` y es compartida. La tarea consultada se guarda solo como un ID en el estado React de cada navegador: abrir su drawer no inicia ni cambia rondas. El organizador dispone de una acción explícita “Votar esta tarea”.

`create_task` y `update_task` validan en PostgreSQL título, descripción y una URL HTTP(S) opcional. En React se repite la validación para mostrar errores de campo. Las URLs incluidas en la descripción se dividen en fragmentos de texto y enlaces React, sin interpretar HTML ni utilizar `dangerouslySetInnerHTML`.

`reorder_tasks` recibe todos los IDs una sola vez, rechaza duplicados y tareas ajenas y actualiza `sort_order` dentro de una transacción. En escritorio se puede arrastrar el asa; el menú ofrece mover arriba, abajo, al principio o al final para móvil y teclado.

`tasks.finalized_from_round_id` identifica la ronda aceptada. El histórico solo incluye rondas reveladas o cerradas y reutiliza el cálculo central de media, mediana, consenso y distribución. `update_final_estimate` modifica únicamente la decisión final de una tarea completada y añade el cambio a `task_estimate_changes`; no actualiza ni elimina votos o rondas.

### Comprobación manual de tareas

1. Crea dos tareas con descripción y URL, abre sus detalles y comprueba que la cabecera de la mesa no cambia.
2. Edita título, descripción y URL durante una ronda y confirma el cambio en otro navegador.
3. Reordena mediante arrastre y mediante las acciones del menú; recarga y verifica que el orden persiste.
4. Finaliza una tarea, abre su detalle y corrige la estimación final.
5. Confirma en el histórico que media, mediana, distribución y votos anteriores no cambian y que solo se actualiza la estimación final.

### Privacidad del voto

El navegador solo tiene permiso `SELECT`. Todas las escrituras pasan por funciones `SECURITY DEFINER` que derivan el usuario de `auth.uid()`. La política de `votes` permite leer el voto propio mientras la ronda está abierta y permite leer todos los votos de la sala solo cuando la ronda está revelada o cerrada. `round_participation` expone únicamente si alguien ya ha votado.

### Limpieza de reacciones

Las reacciones son eventos efímeros, aunque se guardan brevemente para soportar reconexiones. Programa en Supabase Cron una limpieza diaria:

```sql
delete from public.reactions where created_at < now() - interval '24 hours';
````

## Comprobaciones

```bash
pnpm brand:generate
pnpm brand:validate
pnpm lint
pnpm typecheck
pnpm i18n:validate
pnpm test
pnpm build
```

Los E2E multiusuario usan tres contextos independientes y necesitan un proyecto Supabase de pruebas configurado en `.env.local` con `RUN_SUPABASE_E2E=1`. Comprueban cambios de modo, borrado transaccional del voto, histórico, ronda sin votantes y rechazo de llamadas directas. No apuntes estas pruebas a datos de producción.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Mantén el preset de Next.js y el comando de construcción `pnpm build`.
3. Añade `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL` en Production y Preview.
4. Añade las URL de Vercel a las URL permitidas del proyecto Supabase.
5. Despliega y prueba la misma sala en dos navegadores o perfiles privados.

## Arquitectura

- `app/`: rutas, metadatos y proveedores globales.
- `features/rooms`: acceso a Supabase, formularios, estado de sala y Realtime.
- `features/room/components`: mesa, asientos, tareas, baraja, controles y resultados.
- `lib/`: tipos, validaciones y lógica pura comprobable.
- `supabase/migrations`: seguridad y dominio transaccional.
- `tests/` y `e2e/`: pruebas unitarias y de navegador.

TanStack Query conserva e invalida instantáneas; Postgres Changes avisa de cambios duraderos y Presence representa únicamente la conexión. Al desmontar una sala se eliminan todos los canales.

## Limitaciones conocidas del MVP

- El acceso se concede a quien tenga el enlace; no hay contraseña de sala.
- Los avatares son emojis predefinidos.
- La ordenación RPC está preparada, pero la primera interfaz prioriza la lista estable y no incluye todavía arrastre visual.
- El organizador no se transfiere automáticamente si se desconecta; debe hacerlo desde el menú de sala.
