# Internacionalización completa del Planning Poker

Actúa como un ingeniero senior especializado en Next.js, React, TypeScript,
internacionalización, accesibilidad y aplicaciones Realtime.

Debes inspeccionar el repositorio antes de modificarlo. La aplicación de
Planning Poker ya funciona y no debe reconstruirse desde cero.

Implementa internacionalización completa para estos idiomas:

| Idioma | Código |
|---|---|
| Español | `es` |
| Inglés | `en` |
| Alemán | `de` |
| Portugués | `pt` |
| Catalán | `ca` |
| Euskera | `eu` |

La aplicación debe:

1. Detectar automáticamente el idioma preferido del navegador.
2. Permitir cambiar manualmente el idioma.
3. Recordar la selección del usuario.
4. Aplicar el idioma sin perder la sala, tarea o estado actual.
5. Traducir todos los textos propios de la interfaz.
6. Formatear fechas, horas, números y plurales según el idioma.
7. Mantener intactos los textos introducidos por los usuarios.

Respeta:

- La arquitectura existente.
- El diseño actual.
- Supabase y Realtime.
- El sistema de salas.
- Las URLs de invitación.
- La votación.
- El modo observador.
- La gestión de tareas.
- El historial.
- Las reacciones con emojis.
- El responsive.
- RLS y las funciones RPC existentes.

Es una aplicación personal. Añade pruebas ligeras para la lógica esencial, pero
no instales Playwright ni construyas una infraestructura de testing excesiva.

---

# 1. Inspección inicial

Antes de implementar:

1. Revisa la versión de Next.js y confirma si usa App Router.
2. Revisa si ya existe alguna librería de internacionalización.
3. Localiza todos los textos visibles escritos directamente en los
   componentes.
4. Localiza los textos de:
   - Formularios.
   - Botones.
   - Menús.
   - Cabeceras.
   - Modales.
   - Confirmaciones.
   - Mensajes de error.
   - Estados vacíos.
   - Notificaciones.
   - Toasts.
   - Etiquetas accesibles.
   - Textos `aria-label`.
   - Mensajes `aria-live`.
   - Estados de conexión.
   - Historial de rondas.
   - Modo votante/observador.
   - Reacciones con emojis.
5. Localiza formateos manuales de:
   - Fechas.
   - Horas.
   - Números.
   - Media y mediana.
   - Plurales.
6. Revisa si hay errores de Supabase o RPC que se muestran directamente al
   usuario.
7. Revisa cómo se genera la URL de invitación.

Documenta brevemente en el informe final qué solución de internacionalización
has utilizado y por qué encaja con la arquitectura actual.

---

# 2. Librería recomendada

Si el proyecto utiliza Next.js App Router y no tiene todavía una solución de
internacionalización, usa preferiblemente:



text next-intl


Utiliza una versión estable compatible con la versión de Next.js instalada.

Si el repositorio ya utiliza correctamente otra librería, como `react-i18next`,
no introduzcas una segunda solución. Adapta y completa la existente.

No implementes un sistema casero de traducciones si una librería mantenida
resuelve correctamente:

- Mensajes.
- Variables.
- Plurales.
- Fechas.
- Números.
- Fallback.
- Integración con componentes de servidor y cliente.

---

# 3. Estrategia de URLs

Mantén las rutas actuales sin prefijo obligatorio de idioma.

Las URLs deben continuar siendo similares a:



text / text /sala/MVBWK39X


No es necesario convertirlas en:



text /es/sala/MVBWK39X /en/room/MVBWK39X


La URL compartida de una sala debe continuar funcionando independientemente
del idioma del emisor y del receptor.

Ejemplo:

1. Ana usa la aplicación en español.
2. Comparte:



text https://dominio.com/sala/MVBWK39X


3. John abre el enlace con el navegador configurado en inglés.
4. John debe ver la misma sala en inglés.
5. Ana debe continuar viéndola en español.
6. Los dos deben compartir la misma sala y los mismos datos.

El idioma es una preferencia de presentación del cliente. No forma parte de la
identidad de la sala.

No traduzcas segmentos de ruta como:



text /sala/ /room/ /raum/


Utiliza una única ruta estable para evitar romper enlaces existentes.

---

# 4. Prioridad para resolver el idioma

Determina el idioma en este orden:

1. Idioma seleccionado manualmente por el usuario.
2. Preferencia guardada en cookie.
3. Idioma preferido del navegador mediante `Accept-Language`.
4. Fallback predeterminado.

Usa español como fallback:



text es


La selección manual siempre debe prevalecer sobre la detección automática.

## Ejemplos



text Cookie: en Navegador: es-ES Resultado: en text Sin cookie Navegador: de-DE Resultado: de text Sin cookie Navegador: pt-BR Resultado: pt text Sin cookie Navegador: ca-ES Resultado: ca text Sin cookie Navegador: eu-ES Resultado: eu text Sin cookie Navegador: fr-FR Resultado: es


---

# 5. Normalización del idioma del navegador

Implementa una utilidad pura para resolver idiomas.

Debe reconocer variantes regionales y convertirlas al idioma soportado:



text es es-ES es-MX es-AR → es text en en-US en-GB en-AU → en text de de-DE de-AT de-CH → de text pt pt-PT pt-BR → pt text ca ca-ES ca-AD → ca text eu eu-ES → eu


La utilidad debe:

- Ignorar mayúsculas y minúsculas.
- Aceptar guiones y formatos habituales.
- Respetar el orden de preferencia de `Accept-Language`.
- Ignorar idiomas no soportados.
- Usar `es` si no hay coincidencia.

Tipo sugerido:



ts export const supportedLocales = [ "es", "en", "de", "pt", "ca", "eu", ] as const;

export type SupportedLocale = (typeof supportedLocales)[number];


Función orientativa:



ts function resolveSupportedLocale( requestedLocales: string[], fallback?: SupportedLocale, ): SupportedLocale;


No disperses comparaciones de códigos de idioma por toda la aplicación.

---

# 6. Persistencia de la selección

Cuando el usuario selecciona un idioma manualmente:

- Guardar una cookie.
- Usar una duración razonable, por ejemplo un año.
- Aplicar `SameSite=Lax`.
- Establecer `Secure` en producción.
- Aplicar la cookie a toda la aplicación con `Path=/`.
- Actualizar la interfaz inmediatamente.
- Mantener la ruta actual.
- Mantener la sala actual.
- No cerrar la sesión.
- No desconectar Supabase innecesariamente.
- No perder votos ni formularios cuando sea evitable.

Nombre orientativo de la cookie:



text NEXT_LOCALE


También se puede mantener una copia en `localStorage` si la arquitectura lo
necesita, pero la cookie debe ser la fuente principal si el idioma se resuelve
durante SSR.

No guardes la preferencia únicamente en memoria.

No es necesario añadir el idioma a Supabase ni a `room_members` en el MVP. El
idioma es una preferencia local del navegador, no un dato compartido de la
sala.

---

# 7. Selector de idioma

Añade un selector accesible de idioma.

Ubicación recomendada:

- Menú de tres puntos de la cabecera.
- Menú de ajustes.
- Página inicial.
- Debe seguir siendo accesible dentro de una sala.

Etiqueta:



text Idioma


Opciones mostradas en su nombre nativo:



text Español English Deutsch Português Català Euskara


Los nombres de los idiomas deben permanecer reconocibles aunque la interfaz
esté en otro idioma.

## Comportamiento

Al seleccionar un idioma:

1. Guardar la preferencia.
2. Actualizar el proveedor de traducciones.
3. Refrescar únicamente lo necesario.
4. Mantener la URL actual.
5. Mantener el código de la sala.
6. Mantener al usuario dentro de la sala.
7. Mantener sus permisos.
8. Mantener la ronda activa.
9. Mantener el estado de votación.
10. Evitar una recarga completa si la arquitectura permite un refresco seguro.

Si es necesario utilizar:



ts router.refresh()


puede hacerse, siempre que:

- No se cambie la ruta.
- No se pierda la sesión.
- No se dupliquen canales Realtime.
- No se pierda el estado persistido de la sala.

No uses:



ts window.location.href = "/"


No redirijas al usuario a la página principal al cambiar de idioma.

---

md
# 8. Atributo `lang` del documento

Actualiza dinámicamente el atributo de idioma del documento:

```
html


HTML Artifact

Version: 1

); }


Adapta el ejemplo a la librería y versión de Next.js del repositorio.

Evita diferencias entre el idioma renderizado en servidor y cliente. La primera
renderización debe utilizar el mismo idioma en ambos lados para no provocar:

- Errores de hidratación.
- Cambio visual tardío de idioma.
- Parpadeo de español a otro idioma.
- Advertencias de React.

Todos los idiomas solicitados utilizan escritura de izquierda a derecha:



html dir="ltr"


No es necesario implementar RTL en esta fase.

---

# 9. Organización de los mensajes

Crea una estructura clara para los catálogos:



text messages/ ├── es.json ├── en.json ├── de.json ├── pt.json ├── ca.json └── eu.json


Organiza las claves por dominio funcional.

Ejemplo:



json { "Common": { "save": "Guardar", "cancel": "Cancelar", "close": "Cerrar", "edit": "Editar", "delete": "Eliminar", "confirm": "Confirmar", "loading": "Cargando…" }, "Room": { "invite": "Invitar", "copyLink": "Copiar enlace", "connected": "En directo" }, "Voting": { "chooseCard": "Elige una carta", "revealCards": "Destapar cartas" } }


Dominios recomendados:



text Common Home Navigation Room Connection Members Participation Tasks TaskDetails TaskEditor TaskReordering Voting Rounds RoundHistory Results Reactions Validation Errors Confirmations Accessibility Language


Usa claves semánticas:



text Voting.progress Tasks.create Room.copyInviteLink Errors.ROOM_NOT_FOUND


No uses el texto original como nombre de clave:



text "3 de 5 han votado"


Evita:

- Claves demasiado genéricas.
- Traducciones duplicadas sin necesidad.
- Un único JSON sin estructura.
- Concatenar fragmentos de frases.
- Introducir HTML dentro de las traducciones.
- Dejar claves visibles en la interfaz.

Español será el catálogo base y fallback.

---

# 10. Cobertura de traducción

Traduce todos los textos propios de la aplicación.

## Página inicial

Incluye:

- Crear sala.
- Entrar en una sala.
- Nombre de la sala.
- Tu nombre.
- Seleccionar avatar.
- Código de sala.
- Crear.
- Entrar.
- Mensajes de validación.
- Estados de carga.

## Cabecera

Incluye:

- Nombre de la aplicación.
- Invitar.
- Copiar enlace.
- Enlace copiado.
- En directo.
- Conectando.
- Reconectando.
- Sin conexión.
- Menú de opciones.
- Idioma.

## Participantes

Incluye:

- Organizador.
- Participante.
- Votante.
- Observador.
- Ha votado.
- Pendiente.
- Conectado.
- Desconectado.
- Tú.
- Tu participación.
- Participar como votante.
- Participar como observador.

## Tareas

Incluye:

- Tareas.
- Backlog.
- Crear tarea.
- Editar tarea.
- Eliminar tarea.
- Título.
- Descripción.
- URL de la tarea.
- Abrir tarea.
- Tarea activa.
- Tarea pendiente.
- Tarea finalizada.
- Sin tareas.
- Mover arriba.
- Mover abajo.
- Mover al principio.
- Mover al final.
- Reordenar.
- Estimación final.
- Editar estimación final.

## Votación

Incluye:

- Elige una carta.
- Iniciar votación.
- Votación en curso.
- Destapar cartas.
- Repetir ronda.
- Finalizar tarea.
- Aceptar estimación.
- No hay votantes.
- Progreso de votación.
- Esperando votos.
- Cartas reveladas.

## Resultados

Incluye:

- Estimación.
- Estimación final.
- Media.
- Mediana.
- Consenso.
- Sin consenso.
- Distribución.
- Votos especiales.
- Sin votos numéricos.
- Participantes.
- Observadores.

## Historial

Incluye:

- Historial de rondas.
- Número de ronda.
- Fecha.
- Participantes.
- Resultado.
- Estimación aceptada.
- Pendiente de decisión.
- Sin estimación final.
- Todavía no se ha completado ninguna ronda.

## Reacciones

Incluye:

- Enviar emoji.
- Buscar emoji.
- Más emojis.
- No se encontraron emojis.
- Mensaje con emisor, emoji y receptor.
- Mensaje de límite de frecuencia.

## Confirmaciones

Incluye:

- Eliminar tarea.
- Cerrar sala.
- Abandonar sala.
- Cambiar a observador eliminando el voto.
- Corregir estimación final.
- Cancelar.
- Confirmar.

## Estados y errores

Incluye:

- Sala no encontrada.
- Sala cerrada.
- Acción no permitida.
- Error de conexión.
- Error al votar.
- Error al guardar.
- Error al copiar el enlace.
- URL no válida.
- Sesión expirada.
- Error desconocido.

## Accesibilidad

También deben traducirse:

- `aria-label`.
- `aria-description`.
- Mensajes `aria-live`.
- Texto alternativo.
- Descripciones de iconos.
- Etiquetas de reordenación.
- Acciones de menús.
- Nombres accesibles de botones sin texto.

No dejes textos visibles escritos directamente en español dentro de los
componentes, salvo:

- Contenido creado por usuarios.
- Nombres propios.
- Valores de cartas.
- Emojis.
- Datos colaborativos procedentes de Supabase.

---

# 11. No traducir contenido de usuarios

No traduzcas automáticamente:

- Nombre de la sala.
- Nombre del participante.
- Título de una tarea.
- Descripción de una tarea.
- URL de una tarea.
- Código de la sala.
- Comentarios o texto introducido por usuarios.
- Avatares.
- Emojis.
- Valores de las cartas.

Ejemplo:

Si el organizador crea esta tarea:



text Implementar login con Azure


todos los participantes deben ver exactamente ese título, aunque tengan la
interfaz configurada en alemán, inglés o euskera.

La internacionalización se aplica a la interfaz, no al contenido colaborativo.

Tampoco deben traducirse los valores internos almacenados en PostgreSQL. Por
ejemplo:



text pending voting revealed completed voter observer


Estos valores permanecen estables en la base de datos. Solo se traduce su
representación visual.

---

# 12. Mensajes con variables

No formes mensajes concatenando fragmentos traducidos.

Implementación incorrecta:



ts ${voted} de ${total} ${t("haveVoted")}


Implementación correcta:



json { "progress": "{voted} de {total} han votado" }


En inglés:



json { "progress": "{voted} of {total} have voted" }


Uso orientativo:



tsx t("Voting.progress", { voted, total, });


Aplica este principio a:

- Progreso de votación.
- Mensajes de reacciones.
- Número de participantes.
- Número de tareas.
- Número de rondas.
- Confirmaciones.
- Estimaciones corregidas.
- Mensajes que contienen nombres.
- Mensajes de entrada o salida.
- Cambios entre votante y observador.

Ejemplo para reacciones:



json { "reactionSent": "{sender} ha lanzado {emoji} a {target}" }


No almacenes esa frase traducida en Supabase. Cada cliente debe generarla
localmente a partir de los datos del evento.

---

# 13. Plurales

Utiliza pluralización ICU o la funcionalidad equivalente de la librería.

Ejemplo en español:



json { "taskCount": "{count, plural, =0 {Sin tareas} one {# tarea} other {# tareas}}" }


Ejemplo en inglés:



json { "taskCount": "{count, plural, =0 {No tasks} one {# task} other {# tasks}}" }


Aplica pluralización a:

- Tareas.
- Participantes.
- Votantes.
- Observadores.
- Votos.
- Rondas.
- Reacciones.
- Resultados.

No asumas que todos los idiomas pluralizan igual.

Evita implementar manualmente:



ts count === 1 ? "tarea" : "tareas"


si la librería de internacionalización ya ofrece pluralización.

---

# 14. Fechas y horas

Reemplaza los formatos manuales por formateo dependiente del idioma.

Utiliza las funciones de la librería o `Intl.DateTimeFormat`.

Ejemplo orientativo:



ts format.dateTime(round.createdAt, { dateStyle: "medium", timeStyle: "short", });


El mismo valor puede representarse de forma distinta:



text Español: 3 ago 2026, 18:42 text Inglés: Aug 3, 2026, 6:42 PM text Alemán: 03.08.2026, 18:42 text Portugués: 03/08/2026, 18:42


No guardes fechas traducidas o formateadas en PostgreSQL.

La base de datos debe continuar almacenando timestamps. El idioma solo afecta a
la presentación.

Gestiona correctamente:

- Valores nulos.
- Fechas no válidas.
- Zona horaria local.
- Renderización en servidor y cliente.

No mostrar:



text Invalid Date


---

# 15. Números, media y mediana

Usa `Intl.NumberFormat` o la utilidad equivalente del sistema de
internacionalización.

Ejemplo:



text Español: 8,33 text Inglés: 8.33 text Alemán: 8,33


La lógica matemática no debe depender del idioma.

Los valores deben mantenerse internamente como números. No conviertas la coma
decimal en parte del dato.

Formatea únicamente al representar el valor.

Mantén como máximo dos decimales para media y mediana, salvo que el proyecto ya
tenga otra regla.

No mostrar:



text NaN Infinity 8.000000


Si no hay valores numéricos, muestra una traducción equivalente a:



text No disponible


---

# 16. Errores de Supabase y RPC

No muestres directamente al usuario mensajes internos de PostgreSQL o
Supabase cuando puedan transformarse en errores de dominio.

Evita:



ts toast.error(error.message);


si el mensaje contiene información técnica o está escrito en un idioma fijo.

Crea un mapeo estable de códigos de dominio:



text ROOM_NOT_FOUND ROOM_CLOSED NOT_A_ROOM_MEMBER HOST_ONLY OBSERVER_CANNOT_VOTE ROUND_NOT_OPEN INVALID_TASK_URL TASK_TITLE_REQUIRED REACTION_RATE_LIMITED NETWORK_ERROR UNKNOWN_ERROR


Mapea esos códigos a claves traducibles:



ts function getErrorTranslationKey(error: unknown): ErrorTranslationKey;


Ejemplo de catálogo:



json { "Errors": { "ROOM_NOT_FOUND": "La sala no existe.", "ROOM_CLOSED": "La sala está cerrada.", "OBSERVER_CANNOT_VOTE": "Actívate como votante para elegir una carta.", "NETWORK_ERROR": "No se ha podido conectar con el servidor.", "UNKNOWN_ERROR": "Se ha producido un error inesperado." } }


En desarrollo puedes registrar el error técnico:



ts if (process.env.NODE_ENV === "development") { console.error(error); }


En producción muestra un mensaje localizado y seguro.

Si las funciones SQL devuelven actualmente frases en español, adapta las
operaciones necesarias para que devuelvan códigos estables cuando sea
razonable.

---

# 17. Traducciones requeridas

Crea traducciones naturales y completas.

## Español (`es`)

- Español internacional y claro.
- Mantener “Planning Poker” cuando sea conveniente.
- Evitar traducciones excesivamente literales.

## Inglés (`en`)

Utiliza términos habituales:

- Room.
- Host.
- Participant.
- Voter.
- Observer.
- Reveal cards.
- Final estimate.
- Round history.

## Alemán (`de`)

Usa alemán natural y terminología consistente:

- Raum.
- Organisator o una formulación neutral coherente.
- Teilnehmer.
- Beobachter.
- Abstimmung.
- Schätzung.
- Karten aufdecken.

Mantén “Planning Poker” como nombre de la dinámica.

## Portugués (`pt`)

Usa portugués internacional comprensible:

- Sala.
- Organizador.
- Participante.
- Observador.
- Votação.
- Estimativa.
- Revelar cartas.

No mezcles español y portugués.

No es necesario crear catálogos separados para `pt-PT` y `pt-BR`.

## Catalán (`ca`)

Usa catalán natural:

- Sala.
- Organitzador.
- Participant.
- Observador.
- Votació.
- Estimació.
- Historial de rondes.
- Destapar les cartes.

## Euskera (`eu`)

Usa traducciones coherentes y naturales.

Mantén “Planning Poker” cuando una traducción técnica resulte forzada.

Evita dejar textos en castellano como solución temporal.

No generes archivos en los que la mayoría de los valores sigan en español.

---

# 18. Validación de catálogos

Todos los idiomas deben tener las mismas claves.

Añade una utilidad o prueba ligera que verifique:

- Que `es.json` contiene todas las claves base.
- Que `en.json`, `de.json`, `pt.json`, `ca.json` y `eu.json` contienen las
  mismas claves.
- Que no hay valores vacíos.
- Que los objetos tienen estructuras compatibles.
- Que los JSON son válidos.
- Que no hay claves adicionales accidentales.

Usa español como catálogo base.

En desarrollo, una clave ausente debe ser fácil de detectar.

En producción, utiliza fallback a español para evitar mostrar la clave interna.

Nunca debe aparecer al usuario:



text Tasks.editFinalEstimate


Crea, por ejemplo, una función que aplaste las claves anidadas:



ts function flattenMessageKeys( messages: Record<string, unknown>, prefix?: string, ): string[];


Compara el resultado de todos los catálogos con el de español.

---

# 19. Componentes de servidor y cliente

Configura correctamente la internacionalización para:

- Server Components.
- Client Components.
- Layout raíz.
- Metadata.
- Componentes dinámicos.
- Modales.
- Toasts.
- Portales.
- Selector de emojis.
- Componentes Realtime.

Evita pasar todos los catálogos como propiedades a cada componente si la
librería ofrece un proveedor adecuado.

No cargues innecesariamente los seis idiomas en el bundle del navegador.

Carga solamente el catálogo activo cuando sea posible.

Los componentes cliente deben obtener las traducciones mediante el hook o
contexto correspondiente:



tsx const t = useTranslations("Voting");


Los componentes de servidor deben usar la API de servidor de la librería.

---

# 20. Metadata

Traduce la metadata básica:

- Título de la aplicación.
- Descripción.
- Título de la página inicial.
- Título de la sala, si se genera dinámicamente.

Ejemplo:



text Español: Plan Poker — Estimación colaborativa text Inglés: Plan Poker — Collaborative estimation


No incluyas datos privados en metadata pública.

El nombre introducido por el usuario para la sala puede conservarse sin
traducir.

Si la metadata se genera en el servidor, debe usar el mismo idioma resuelto para
el layout.

---

# 21. Realtime e idioma

Cada participante debe poder usar un idioma diferente dentro de la misma sala.

Ejemplo:

- Organizador: español.
- Invitado 1: inglés.
- Invitado 2: alemán.
- Invitado 3: euskera.

Todos comparten:

- Sala.
- Tareas.
- Rondas.
- Votos.
- Presencia.
- Reacciones.

Cada uno ve localizados:

- Botones.
- Estados.
- Contadores.
- Mensajes.
- Fechas.
- Historial.
- Etiquetas.

No guardes textos traducidos dentro de los eventos Realtime.

Incorrecto:



json { "message": "Ana ha lanzado fuego a Carlos" }


Correcto:



json { "type": "reaction", "senderMemberId": "member-1", "targetMemberId": "member-2", "emoji": "🔥" }


Cada cliente construye el mensaje en su idioma:



text Español: Ana ha lanzado 🔥 a Carlos text Inglés: Ana sent 🔥 to Carlos text Alemán: Ana hat Carlos 🔥 geschickt


Aplica el mismo principio a eventos como:

- Cambio a observador.
- Cambio a votante.
- Entrada en la sala.
- Cartas reveladas.
- Estimación aceptada.
- Estimación corregida.

Cambiar de idioma no debe:

- Crear un nuevo cliente de Supabase.
- Duplicar canales.
- Duplicar listeners.
- Perder Presence.
- Eliminar el voto actual.
- Cambiar la identidad del usuario.

---

# 22. Selector de emojis

Si la librería del selector de emojis admite localización:

- Configúrala según el idioma activo.
- Traduce el campo de búsqueda.
- Traduce las categorías.
- Traduce los mensajes vacíos.
- Traduce las etiquetas accesibles.

Si no ofrece soporte para alguno de los idiomas:

- Utiliza el fallback más apropiado.
- Traduce al menos el contenedor, botones y etiquetas de la aplicación.
- No rompas la búsqueda.
- No elimines emojis por no tener una descripción traducida.

No traduzcas los emojis.

---

# 23. Dirección del texto

Todos los idiomas solicitados utilizan escritura de izquierda a derecha.

Configura:



html dir="ltr"


No es necesario implementar RTL en esta fase.

Sin embargo, evita acoplar la interfaz de forma que resulte imposible añadir
idiomas RTL en el futuro.

Cuando sea razonable, utiliza propiedades CSS lógicas:



css margin-inline-start margin-inline-end padding-inline inset-inline


en vez de depender siempre de `left` y `right` para elementos de interfaz.

No alteres la lógica geométrica de los asientos de la mesa si depende de
coordenadas físicas.

---

# 24. Diseño y responsive

Las traducciones pueden ocupar más espacio que el español. Revisa
especialmente el alemán.

La interfaz debe:

- Evitar cortar botones importantes.
- Permitir varias líneas cuando sea necesario.
- Mantener los iconos alineados.
- Evitar scroll horizontal global.
- No tapar nombres de jugadores.
- Mantener legibles las etiquetas de observador y votante.
- Mantener funcional el sidebar de tareas.
- Mantener funcional el selector de cartas.
- Mantener funcional el historial.

Prueba visualmente, como mínimo:



text 375 px 430 px 768 px 1024 px 1440 px


No uses anchos fijos calculados para textos españoles.

Cuando haya poco espacio:

- Permite `flex-wrap`.
- Usa textos breves y naturales.
- Trunca solo cuando sea necesario.
- Añade un tooltip accesible si se trunca.
- No reduzcas excesivamente el tamaño de letra.
- Mantén áreas táctiles adecuadas.

---

# 25. Accesibilidad

Todos los textos accesibles también deben internacionalizarse:

- `aria-label`.
- `aria-description`.
- `aria-live`.
- Texto alternativo.
- Botones que solo muestran iconos.
- Estado de conexión.
- Estado de votación.
- Reacciones.
- Reordenación.
- Apertura y cierre de modales.
- Errores de formularios.

Al cambiar de idioma:

- Actualizar el atributo `lang`.
- Anunciar de forma accesible el cambio.
- Mantener el foco razonablemente.
- No cerrar modales sin necesidad.
- No perder navegación por teclado.

Ejemplos:



text Idioma cambiado a Español Language changed to English Sprache zu Deutsch geändert Idioma alterado para Português Idioma canviat a Català Hizkuntza Euskarara aldatu da


El selector debe tener:

- Etiqueta accesible.
- Foco visible.
- Uso mediante teclado.
- Estado seleccionado.
- Nombres nativos de los idiomas.

---

# 26. Traducción de estados internos

No muestres directamente enums o valores internos.

Valores internos:



text pending voting revealed completed closed cancelled voter observer host participant


Deben convertirse en traducciones:



tsx t(Tasks.status.${task.status});


Ejemplo de catálogo:



json { "Tasks": { "status": { "pending": "Pendiente", "voting": "En votación", "revealed": "Cartas reveladas", "completed": "Finalizada" } } }


Usa tipos de TypeScript para controlar los valores válidos cuando sea posible.

No mostrar:



text Task status: completed


Mostrar:



text Tarea finalizada


Los enums y valores de la base de datos no deben cambiar según el idioma.

---

# 27. Idioma y navegación inicial

## Usuario nuevo

1. Abre la aplicación sin cookie.
2. El servidor interpreta `Accept-Language`.
3. Selecciona el primer idioma soportado.
4. Renderiza la primera página en ese idioma.
5. El atributo `lang` coincide.
6. No aparece un cambio visual tardío de idioma.

## Usuario con preferencia guardada

1. Abre la aplicación con:



text NEXT_LOCALE=de


2. Aunque el navegador esté en español, la aplicación aparece en alemán.
3. La selección manual se conserva.

## Idioma no soportado

1. El navegador solicita francés.
2. No hay selección manual.
3. La aplicación usa español.

## Cambio dentro de una sala

1. El usuario está en:



text /sala/MVBWK39X


2. Cambia de español a inglés.
3. Continúa en:



text /sala/MVBWK39X


4. Mantiene su identidad.
5. Mantiene su rol.
6. Mantiene su modo votante u observador.
7. Mantiene su voto.
8. La interfaz aparece en inglés.

---

# 28. Pruebas ligeras

No instales Playwright.

Usa la herramienta de pruebas existente. Si no hay ninguna, configura Vitest
de forma mínima.

Añade pruebas unitarias para la lógica esencial.

## Resolución del idioma

Verifica:



text es-ES → es en-GB → en de-AT → de pt-BR → pt ca-ES → ca eu-ES → eu fr-FR → es


También comprueba:

- Se respeta el primer idioma soportado de una lista.
- Una cookie válida tiene prioridad.
- Una cookie no válida se ignora.
- El fallback es español.
- La comparación no depende de mayúsculas.

## Catálogos

Verifica:

- Todos los archivos tienen las mismas claves.
- No existen traducciones vacías.
- Los JSON son válidos.
- Las estructuras son compatibles.

## URLs

Verifica:

- Cambiar de idioma no modifica `/sala/[code]`.
- La URL de invitación no contiene un idioma fijo.
- El código de sala se conserva.

## Formato

Verifica:

- El valor numérico interno no cambia.
- La presentación utiliza el separador correspondiente.
- Una fecha válida se formatea sin producir `Invalid Date`.

No añadas pruebas visuales exhaustivas.

---

# 29. Comprobación manual

Documenta o realiza estas verificaciones.

## Detección automática

1. Eliminar la cookie de idioma.
2. Configurar el navegador en inglés.
3. Abrir la aplicación.
4. Confirmar que aparece en inglés.
5. Repetir con alemán, portugués, catalán y euskera.

## Selección manual

1. Abrir la aplicación en español.
2. Cambiar a alemán.
3. Recargar.
4. Confirmar que continúa en alemán.
5. Cerrar y volver a abrir el navegador.
6. Confirmar que se conserva la preferencia.

## Sala multiidioma

1. Abrir una sala en un navegador configurado en español.
2. Abrir la misma sala en una ventana privada.
3. Seleccionar inglés en el segundo navegador.
4. Confirmar que ambos ven la misma sala.
5. Confirmar que cada uno ve la interfaz en su idioma.
6. Crear una tarea.
7. Confirmar que el título de usuario no se traduce.
8. Iniciar y revelar una ronda.
9. Confirmar que estados, fechas y estadísticas sí se traducen.

## Cambio durante la ronda

1. Seleccionar una carta.
2. Cambiar el idioma.
3. Confirmar que el voto se conserva.
4. Confirmar que no aparecen participantes duplicados.
5. Confirmar que Realtime continúa conectado.

## Responsive

Comprobar:



text 375 px 768 px 1440 px


Realizar especialmente la revisión con alemán por la mayor longitud de algunos
textos.

---

# 30. Criterios de aceptación

La funcionalidad está terminada cuando:

- [ ] La aplicación soporta español.
- [ ] La aplicación soporta inglés.
- [ ] La aplicación soporta alemán.
- [ ] La aplicación soporta portugués.
- [ ] La aplicación soporta catalán.
- [ ] La aplicación soporta euskera.
- [ ] El idioma se detecta desde el navegador.
- [ ] Las variantes regionales se normalizan.
- [ ] Español se utiliza como fallback.
- [ ] El usuario puede cambiar manualmente el idioma.
- [ ] La selección manual tiene prioridad sobre el navegador.
- [ ] La selección se conserva después de recargar.
- [ ] El selector muestra los nombres nativos de los idiomas.
- [ ] Cambiar de idioma mantiene la ruta actual.
- [ ] Cambiar de idioma mantiene la sala.
- [ ] Cambiar de idioma no elimina el voto.
- [ ] Cambiar de idioma no duplica suscripciones Realtime.
- [ ] La URL de invitación funciona con cualquier idioma.
- [ ] No se añaden prefijos obligatorios a las rutas.
- [ ] El atributo `lang` refleja el idioma activo.
- [ ] Todos los catálogos tienen las mismas claves.
- [ ] No existen traducciones vacías.
- [ ] Todos los textos propios de la interfaz están traducidos.
- [ ] Los textos accesibles están traducidos.
- [ ] Los errores de dominio están traducidos.
- [ ] Los estados internos están traducidos.
- [ ] Las fechas se formatean según el idioma.
- [ ] Los números se formatean según el idioma.
- [ ] Los plurales funcionan correctamente.
- [ ] Los mensajes con variables no concatenan fragmentos.
- [ ] Los eventos Realtime transportan datos y no frases traducidas.
- [ ] El contenido de los usuarios no se traduce.
- [ ] La interfaz continúa funcionando en móvil.
- [ ] Los textos alemanes largos no rompen el layout.
- [ ] Las pruebas unitarias esenciales pasan.
- [ ] El lint pasa.
- [ ] El typecheck pasa.
- [ ] El build de producción pasa.

---

# 31. Restricciones

No hagas lo siguiente:

- No reconstruyas la aplicación desde cero.
- No cambies Supabase.
- No cambies el modelo de seguridad.
- No desactives RLS.
- No traduzcas contenido introducido por los usuarios.
- No traduzcas valores almacenados en la base de datos.
- No guardes frases traducidas en eventos Realtime.
- No añadas un prefijo obligatorio de idioma a las salas.
- No rompas enlaces de invitación existentes.
- No redirijas al inicio al cambiar de idioma.
- No guardes la preferencia únicamente en memoria.
- No detectes el idioma solo después de la hidratación si provoca parpadeo.
- No crees un cliente nuevo de Supabase al cambiar de idioma.
- No dupliques suscripciones Realtime.
- No uses `dangerouslySetInnerHTML` para las traducciones.
- No concatentes fragmentos de frases.
- No dejes claves internas visibles.
- No dejes textos españoles como traducciones temporales.
- No instales Playwright.
- No añadas una suite de pruebas desproporcionada.
- No dejes `TODO` en funcionalidad crítica.

---

# 32. Proceso de implementación

Sigue este orden:

1. Inspeccionar la arquitectura y la versión de Next.js.
2. Inventariar todos los textos visibles.
3. Elegir o adaptar la librería de internacionalización.
4. Definir idiomas soportados y tipos TypeScript.
5. Implementar resolución desde cookie y `Accept-Language`.
6. Configurar el proveedor de traducciones.
7. Configurar los atributos `lang` y `dir`.
8. Crear los seis catálogos.
9. Implementar el selector de idioma.
10. Persistir la selección manual.
11. Traducir el layout y la página inicial.
12. Traducir la sala y los participantes.
13. Traducir tareas y formularios.
14. Traducir votación, resultados e historial.
15. Traducir los modos observador y votante.
16. Traducir reacciones y selector de emojis.
17. Traducir errores y confirmaciones.
18. Adaptar fechas, números y plurales.
19. Revisar eventos Realtime para eliminar frases localizadas.
20. Revisar el responsive con textos largos.
21. Añadir pruebas ligeras.
22. Ejecutar las comprobaciones de calidad.
23. Actualizar el README.

---

# 33. Documentación

Actualiza el README con:

- Librería utilizada.
- Idiomas soportados.
- Idioma fallback.
- Cómo funciona la detección automática.
- Nombre de la cookie.
- Cómo cambiar de idioma.
- Cómo añadir un nuevo idioma.
- Cómo añadir una nueva clave.
- Cómo validar los catálogos.
- Cómo probar un idioma en local.
- Cómo eliminar la preferencia guardada.

Incluye un ejemplo para añadir un nuevo idioma.

Ejemplo orientativo:



text

Añadir el código a supportedLocales.
Crear messages/fr.json.
Copiar la estructura de es.json.
Traducir todos los valores.
Añadir el idioma al selector.
Ejecutar la validación de catálogos.

Incluye también cómo simular la detección automática:

- Cambiar el idioma preferido del navegador.
- Eliminar la cookie `NEXT_LOCALE`.
- Abrir una ventana privada.
- Reiniciar el servidor local si fuera necesario.

---

# 34. Comandos de validación

Detecta los scripts reales del `package.json`.

Ejecuta, si existen:



bash pnpm install pnpm lint pnpm typecheck pnpm test pnpm build


No instales ni ejecutes Playwright.

Si existe un script específico para validar catálogos, ejecútalo:



bash pnpm i18n:validate


Si no existe, puedes añadir uno ligero.

No inventes resultados. Si un comando no se puede ejecutar, explica la
limitación encontrada.

Corrige los errores de:

- TypeScript.
- ESLint.
- Catálogos incompletos.
- Claves inexistentes.
- Build de producción.
- Hidratación relacionados con el idioma.

---

# 35. Informe final

Al terminar, informa de forma concisa:

1. Librería de internacionalización utilizada.
2. Archivos creados y modificados.
3. Cómo se detecta el idioma.
4. Cómo se normalizan las variantes regionales.
5. Cómo se guarda la selección manual.
6. Cómo se cambia el idioma sin abandonar la sala.
7. Cómo se mantiene estable la URL de invitación.
8. Cómo se actualiza el atributo `lang`.
9. Cómo se organizan los catálogos.
10. Cómo se validan las claves.
11. Cómo se traducen los errores.
12. Cómo se formatean las fechas y los números.
13. Cómo se manejan los plurales.
14. Cómo se evita traducir contenido de usuarios.
15. Cómo funcionan los eventos Realtime multiidioma.
16. Pruebas añadidas.
17. Comandos ejecutados y resultados.
18. Limitaciones restantes.

No declares la tarea terminada si:

- Falta alguno de los seis idiomas.
- El idioma seleccionado se pierde al recargar.
- Cambiar de idioma abandona la sala.
- Cambiar de idioma elimina un voto.
- La URL compartida obliga a usar el idioma del emisor.
- Los eventos Realtime contienen frases ya traducidas.
- Quedan claves internas visibles.
- El atributo `lang` no coincide con el idioma mostrado.
- La detección provoca un cambio visual después de hidratar.

