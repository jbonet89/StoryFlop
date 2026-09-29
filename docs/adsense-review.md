# Revisión de AdSense

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
