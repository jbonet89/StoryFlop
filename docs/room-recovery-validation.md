# Validación local: participantes y consenso

Fecha: 29 de octubre de 2026. Sin despliegue, push, migraciones ni escrituras en producción.

## Cambios

- El observador conserva la píldora inferior y pierde la tarjeta interna que estrechaba el nombre.
- La sala recupera su snapshot al recibir `focus`, `pageshow`, `visibilitychange` u `online`. Los eventos consecutivos se agrupan en una recuperación.
- Se añade una consulta de respaldo cada 15 segundos mientras la página está visible, para recuperar eventos de datos perdidos aunque el WebSocket parezca conectado.
- Al reanudar, se conecta Realtime si está desconectado y se vuelve a publicar la presencia si el canal está suscrito. Al perder conexión o fallar el anuncio se invalida la lista de presencia anterior.
- Al pasar de votación a cartas reveladas, todos los clientes que observaron la votación celebran si cada votante ha votado el mismo valor. Los observadores no cuentan. La animación dura menos de dos segundos, parte del centro, no bloquea clics y respeta movimiento reducido. No se reproduce al entrar en una ronda ya revelada.

## Evidencia

- 172 pruebas unitarias pasaron, incluidas recuperación de ciclo de vida y reglas de unanimidad.
- 33 casos de navegador pasaron: 11 escenarios en Chromium de escritorio, WebKit y Chromium con viewport de iPhone 13.
- Se volvieron a ejecutar los 6 casos de celebración y presencia tras ampliar la prueba con pérdida y recuperación de conexión; pasaron.
- Compilación, TypeScript y ESLint comprobados localmente.
- Captura visual del confeti en WebKit: `outputs/consensus-webkit.png` (artefacto local ignorado por Git).

La batería cubre el duplicado de observador; cambios de nombre/modo y retirada de participantes sin eventos Realtime; recuperación por foco, restauración de página, visibilidad, red y consulta periódica; presencia al salir y volver; nuevo anuncio al reanudar y recuperar red; actualizaciones de voto por WebSocket; unanimidad, discrepancias, votos pendientes, movimiento reducido y ausencia de repetición tras recargar.

## Límites del diagnóstico de Safari

Se ha probado el motor WebKit en Windows con Auth, REST y el protocolo WebSocket simulados e interceptados. Esto permite probar pérdidas de eventos de forma controlada y evita utilizar producción. No sustituye una prueba en Safari real de macOS/iOS con suspensión física del dispositivo y un Supabase de pruebas.

La dependencia previa del WebSocket, sin reconciliación periódica ni recuperación explícita de presencia al reanudar, es una explicación compatible con lo observado. No se ha confirmado la causa exacta del incidente original en Safari.

## Aviso corporativo de categorización

La captura indica `Category: Uncategorized`; no identifica al proveedor de filtrado ni demuestra por sí sola que StoryFlop contenga malware. La categoría depende de la base de clasificación del proveedor y de las reglas de la empresa. No existe una etiqueta HTML o ajuste de Vercel que obligue a esos filtros a aceptar una categoría.

IT debe identificar el proveedor y consultar `https://storyflop.com` y la URL que provoca el aviso. Después puede solicitar la clasificación como herramienta de colaboración/productividad para estimación ágil, según las categorías disponibles, o autorizar el dominio conforme a su política interna. No se ha enviado ninguna solicitud externa.

Texto sugerido: «StoryFlop es una herramienta web de planning poker para equipos de software. Permite estimar tareas en sesiones colaborativas. Solicitamos revisar storyflop.com y clasificarlo en la categoría de colaboración o productividad que corresponda.»

Referencias oficiales:

- Zscaler, consulta de URL y solicitud de reclasificación: https://help.zscaler.com/zia/looking-up-urls-site-review
- Palo Alto Networks, diagnóstico y solicitud de cambio: https://docs.paloaltonetworks.com/advanced-url-filtering/administration/troubleshooting/incorrect-categorization
- Supabase, presencia y reconciliación del estado: https://supabase.com/docs/guides/realtime/presence
