# Revisión de AdSense

## Recursos públicos · primera fase (17 de octubre de 2026)

- `/recursos`: índice editorial con seis guías, demo y plantilla.
- `/recursos/primera-sesion`: preparación, roles, votación y registro del acuerdo.
- `/recursos/resolver-desacuerdos`: caso ficticio trabajado de votos 3, 5 y 13.
- `/recursos/historias-listas-para-estimar`: tres ejemplos originales con alcance, criterios y preguntas.
- `/recursos/plantilla-refinamiento`: ficha editable, copia, descarga de texto e impresión, con ejemplo cumplimentado. No persiste cambios.
- `/demo`: simulación local de dos rondas, sin crear salas ni acceder al backend. Los personajes son ficticios y el voto de quien prueba se conserva aunque discrepe.
- `/sobre-storyflop`: propósito, titular, criterios editoriales y contacto ya publicado en el aviso legal.

Los recursos completos están traducidos a español, inglés, francés, italiano, alemán, portugués, catalán, euskera y ruso. Las URL españolas originales se conservan; los demás idiomas utilizan prefijos, por ejemplo `/en/recursos` y `/de/demo`. Cada versión tiene idioma de documento, canónica y alternancias hreflang recíprocas en HTML y sitemap. Las nueve portadas enlazan a su versión correspondiente. El selector conserva la página al cambiar de idioma; las plantillas descargadas y las cifras de la demo también se localizan. El texto editorial y la ficha están disponibles sin JavaScript; la demo requiere JavaScript para interactuar y enlaza un caso legible sin él.

Los recursos no cargan el script ni unidades de AdSense. La navegación desde la portada carga un documento nuevo para descartar su runtime publicitario. No se han cambiado ajustes de la cuenta de AdSense ni solicitado una revisión. La publicación de estos recursos no garantiza aprobación.

Al cambiar una guía, mantener su fecha de revisión y la fecha correspondiente del sitemap. Los casos ficticios deben seguir identificados como tales. No atribuir experiencia, certificaciones, resultados o testimonios que no estén acreditados.

Los catálogos editoriales viven en `messages/resources/{locale}.json`, sin fallback parcial entre idiomas. `tests/resource-localization.test.ts` valida cobertura y estructura de cada guía, textos, plantillas y parámetros de interpolación. `e2e/resource-localization.spec.ts` recorre las diez páginas de los nueve idiomas sin JavaScript, comprueba enlaces de idioma y prueba demo, descarga y selector en escritorio y móvil.

Verificación: `e2e/resources.spec.ts` cubre la demo, la descarga del texto editado, la impresión, lectura sin JavaScript, idioma, canónicas, sitemap, desbordamiento y descarte del runtime publicitario en escritorio y móvil.

## Segunda fase

Tres guías nuevas, casos antes/después, comparador y métricas agregadas: ver [informe de segunda fase](phase-two-review.md). Se ha consultado el rechazo vigente en AdSense. La cuenta de Search Console no tiene acceso a la propiedad del dominio; la auditoría pública no prueba indexación.

## Configuración publicitaria existente

La portada incorpora una guía editorial visible y renderizada en el HTML inicial, traducida a los nueve idiomas. Explica estimación relativa, preparación, desacuerdos y una ronda ilustrativa. No se utiliza un mínimo de palabras como garantía de aprobación.

El script se incluye únicamente en `/` y las portadas de idioma. Las entradas desde la landing a salas y páginas legales cargan un documento nuevo para descartar el runtime de Auto ads. No añadir el script al layout compartido, salas, errores ni páginas de navegación.

Antes de solicitar otra revisión tras desplegar:

1. En AdSense → Anuncios → Editar sitio → Exclusiones de páginas, excluir `/sala/` y todas sus páginas. Excluir también `/aviso-legal`, `/privacidad` y `/cookies`. Estas opciones viven en la cuenta de AdSense, no en el repositorio.
2. Revisar la vista previa de Auto ads y excluir la zona de creación/entrada (`.landing-grid`), la navegación y el pie. Evitar anuncios que se confundan con los controles. Comprobar formatos superpuestos y viñetas antes de activarlos.
3. Comprobar en producción la portada, los idiomas y las salas en escritorio y móvil, incluidos los flujos de entrada y salida. Verificar que el contenido se lee sin ejecutar JavaScript.
4. Revisar en la cuenta la configuración de consentimiento de Google para los territorios donde se sirvan anuncios y las páginas de privacidad y cookies. Este cambio no configura la cuenta ni certifica el cumplimiento de otras políticas.
5. Solicitar la revisión del sitio desplegado desde el Centro de políticas. Google decide la aprobación; estos cambios abordan el motivo comunicado, sin garantizarla.

Referencias:

- https://support.google.com/publisherpolicies/answer/11112688?hl=es
- https://support.google.com/adsense/answer/9262311?hl=es
- https://support.google.com/adsense/answer/9305577?hl=es

La captura de otro sitio es una referencia visual, no prueba de que sus ubicaciones estén permitidas. El icono AdChoices informa sobre publicidad y sus controles; por sí solo no identifica la plataforma que monetiza un sitio.


## Espacios publicitarios condicionales

`NEXT_PUBLIC_ADSENSE_ENABLED` está desactivado por defecto. Mientras no sea exactamente `true`, no se renderizan unidades ni se carga el runtime de AdSense: no hay márgenes ni columnas reservadas. El meta de verificación de la cuenta y ads.txt permanecen publicados.

Tras la aprobación, configurar `NEXT_PUBLIC_ADSENSE_ENABLED=true` en producción y volver a desplegar (Next.js integra las variables públicas durante el build). La aplicación no puede consultar automáticamente el estado de aprobación de la cuenta. No activar el interruptor solo para simular una aprobación.

La portada tiene cuatro ubicaciones: tras el bloque inicial, entre cómo funciona y funciones, entre casos de uso y preguntas frecuentes, y junto a las preguntas frecuentes. Las tres unidades adaptables reutilizan el bloque de display existente; no se han creado identificadores ficticios. Las nueve versiones usan las mismas ubicaciones y etiquetas traducidas. No se añaden anuncios a salas, formularios, demo, recursos ni páginas legales.

Cuando se activan, los bloques se solicitan visibles, como recomienda Google. `data-ad-status="unfilled"` oculta el bloque completo, incluidos sus márgenes. Los márgenes y la columna lateral del FAQ solo aparecen con `filled` o `unfill-optimized` (este último es contenido optimizado por Google y no debe ocultarse como vacío). Sin respuesta, no hay márgenes ni columna lateral añadidos; Google puede reservar temporalmente altura durante la carga. No se fuerza una altura cero en anuncios pendientes ni se oculta una creatividad servida.

Referencia: https://support.google.com/adsense/answer/10762946?hl=es
