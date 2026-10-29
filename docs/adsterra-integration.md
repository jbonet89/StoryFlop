# Publicidad de Adsterra · revisión del 29 de octubre de 2026

## Revisión de condiciones

Se revisaron las condiciones oficiales vigentes, no solo el extracto pegado en el chat:

- https://adsterra.com/publishers-terms-managed/ (apartados 4.2, 4.7, 4.9 y 6)
- https://help-publishers.adsterra.com/en/articles/5210780-adding-ads-to-a-static-html-site
- https://adsterra.com/cookies/
- https://adsterra.com/privacy-policy-managed/
- https://www.aepd.es/preguntas-frecuentes/17-internet-y-redes-sociales/FAQ-1707-importancia-de-las-cookies-en-la-proteccion-de-datos

La versión anterior introducía un iframe propio alrededor de los códigos para aislarlos. El apartado 4.7 exige permiso escrito para esa técnica. Se ha eliminado ese envoltorio y el constructor srcDoc. Los tags se montan directamente en el documento, conservando claves, tamaños, opciones y URLs. Los iframes que el propio formato `iframe` de Adsterra crea para una creatividad son distintos de introducir el tag en un iframe nuestro.

No se ha encontrado aprobación expresa para obligar a esperar cinco segundos y retirar un anuncio automáticamente. No se implementa esa espera. No se condiciona la entrada, votación o cualquier función a aceptar publicidad o pulsar un anuncio. No hay incentivos, refresco periódico de anuncios, popunders, Social Bar, Smartlinks ni navegación publicitaria forzada.

No se alteran los tamaños de las creatividades ni se ocultan anuncios servidos con un timeout. Si el viewport cambia después de una carga, no se solicita otra creatividad automáticamente; el contenedor permite desplazamiento si es necesario. Una solicitud fallida no añade hueco. Si el proveedor sirve un iframe vacío, no puede certificarse el no-fill desde nuestro código: se respeta el resultado del proveedor.

## Ubicaciones

- Portada: un banner horizontal después de la presentación y un Native 4:1 antes de preguntas frecuentes.
- Acceso a sala: un banner 300×250 debajo de la tarjeta de nombre/avatar, únicamente cuando se muestra el formulario y no hay error de consulta.
- Sin anuncios en preparación/restauración, errores de acceso, mesa de votación, recursos, demo y páginas legales.

El 300×250 no es obligatorio para entrar, no tiene cuenta atrás y queda fuera del formulario y sus botones. Tras entrar se carga un documento nuevo, descartando el código publicitario antes de mostrar historias o votos. Si una sesión se recupera mientras el formulario estuvo montado, también se recarga antes de mostrar la mesa.

## Formatos

- 728×90: 31210775e07ed4d1bfb4e74bfbe50383, contenedor de al menos 728 px.
- 320×50: 2cef96db594fff17ce9c57edb12b315c, contenedor de 320–727 px.
- Native 4:1: 973a91795cf468905d9b39cff1f465ba, una sola vez, contenedor de al menos 900 px. No se monta una versión recortada en móvil. La guía adjunta recomienda acordar con el proveedor un diseño adecuado para móvil.
- 300×250: 0082de9655db330634ceb0623b845da8, junto a la pantalla de nombre si hay al menos 300 px disponibles.

## Consentimiento y privacidad

El aviso aparece donde exista una ubicación publicitaria, incluida la entrada directa a una sala. Aceptar y rechazar están en la misma capa y con la misma importancia visual. No se hacen solicitudes a la red antes de aceptar. Preferencia versionada `storyflop.advertising.v2`: aceptación/rechazo y caducidad de 180 días, sin identificador personal. Se vuelve a preguntar a quienes tenían v1 porque ahora se amplía el ámbito a la pantalla de acceso. Si el almacenamiento falla, la elección dura el documento actual.

El pie y la pantalla de acceso tienen controles para cambiar la elección. Rechazar después de aceptar recarga el documento para descartar scripts ejecutados; también se observa la retirada desde otra pestaña y la caducidad. Esto no deshace solicitudes ya realizadas ni elimina cookies de terceros.

Los scripts estándar de terceros se ejecutan en la página y pueden leer su contenido y URL. Se ha retirado la afirmación anterior de que estaban aislados. StoryFlop no añade nombres, historias ni votos a los parámetros de los anuncios; el referente HTTP se limita al origen, pero esto no impide que código ejecutado en la página lea su URL. No se cargan estos scripts en la mesa privada. Usar nombres no sensibles y no colocar publicidad en contenido privado sigue siendo relevante.

Aviso, preferencias y etiquetas disponibles en nueve idiomas. Políticas de privacidad y cookies actualizadas en español, como el resto de textos legales existentes.

## Tráfico y límites de la revisión

Solo se permite carga real en `storyflop.com` y `www.storyflop.com`; se omiten agentes automatizados reconocibles. La detección por user-agent no certifica tráfico humano ni identifica todos los proxies. No se puede certificar la calidad del tráfico, audiencia, identidad del titular, licencias, configuración de campañas o estado de aprobación en Adsterra desde el repositorio. Los códigos facilitados no sustituyen comprobar la aprobación del dominio en el panel. El apartado 4.2 permite rechazar audiencias extremadamente limitadas sin fijar aquí un umbral numérico.

El contenido público revisado describe una herramienta de estimación y guías; no se han observado categorías prohibidas en esas páginas. No es una auditoría de todos los contenidos introducidos por usuarios ni una certificación legal o contractual del sitio.

## Pruebas y operación

`NEXT_PUBLIC_ADSTERRA_ENABLED=false` desactiva la integración tras redesplegar. `NEXT_PUBLIC_ADSTERRA_TEST_MODE=true` habilita en localhost únicamente rutas de fixtures `/__adsterra-test/{format}.js`, que las pruebas interceptan. No solicita tags reales en localhost, previews ni para headless en producción. No existe una ruta real que sirva esos fixtures fuera de las pruebas. No se crean impresiones ni clics facturables para probar.

Pruebas cubren rechazo persistente, v1 sin autorización automática, caducidad, carga directa fuera de iframes propios, tamaños, acceso a sala con y sin publicidad, navegación completa antes de la mesa y ausencia de anuncios en ella. No se hacen cambios de esquema ni escrituras de prueba en Supabase.

Se mantienen el meta de verificación y la línea histórica de AdSense en ads.txt: no cargan publicidad y no se inventan declaraciones de vendedores de Adsterra.
