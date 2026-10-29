# Publicidad de Adsterra · 29 de octubre de 2026

Sustituye la carga de AdSense en las portadas de los nueve idiomas. Dos ubicaciones: banner tras el bloque inicial y nativo antes de preguntas frecuentes. No carga Popunder, Social Bar ni Smartlink.

## Formatos y tamaños

- Banner 728×90: 31210775e07ed4d1bfb4e74bfbe50383, cuando el contenedor tiene al menos 728 px.
- Banner 320×50: 2cef96db594fff17ce9c57edb12b315c, cuando hay entre 320 y 727 px disponibles. Por debajo de 320 px no se monta ningún anuncio.
- Native 4:1: 973a91795cf468905d9b39cff1f465ba, una sola vez, solo con al menos 900 px disponibles. No se adapta su CSS interno ni se duplica el código. La guía del proveedor recomienda acordar un diseño específico para móvil, por lo que este bloque se omite en pantallas pequeñas.
- Banner 300×250: 0082de9655db330634ceb0623b845da8. Código registrado pero no montado. No existe espera publicitaria ni anuncios dentro de las salas. La transición temporal de cinco segundos queda pendiente de confirmar condiciones con Adsterra y de una implementación posterior.

La guía aportada es una referencia del proveedor, no una autorización para ampliar formatos o cambiar ajustes de la cuenta.

## Consentimiento y aislamiento

`NEXT_PUBLIC_ADSTERRA_ENABLED=false` apaga la integración; por defecto está disponible pero no carga scripts hasta aceptar publicidad. La preferencia versionada `storyflop.advertising.v1` guarda solo aceptación/rechazo y caducidad de 180 días, sin identificador personal. Si el almacenamiento falla, la elección dura únicamente el documento actual. Se puede rechazar con el mismo número de pasos y seguir usando la herramienta. Las preferencias del pie y de la página de cookies permiten retirar el consentimiento; se retiran los marcos activos y se propaga el rechazo entre pestañas del mismo origen. La retirada no borra cookies de terceros ni deshace peticiones ya enviadas.

Cada código se ejecuta en un iframe con origen opaco (`sandbox` sin `allow-same-origin` ni navegación superior), por lo que no puede consultar el DOM o almacenamiento de la aplicación. Los enlaces publicitarios pueden abrir pestañas tras una interacción; no se habilita navegación superior. El referente se limita al origen. Los scripts conservan los identificadores y tamaños suministrados y la configuración `atOptions` se separa por marco.

Los bloques se cargan cerca del viewport y reservan su tamaño durante la solicitud. Un error de script elimina el hueco; si no se detecta contenido renderizado, se retira después de unos 10–12 segundos. Un iframe insertado no prueba que una creatividad haya recibido una impresión pagada: no se dispone de un callback oficial de no-fill y no puede inspeccionarse el contenido publicitario de otro origen. No se promete detección perfecta de anuncios vacíos. No se cuentan como ingresos los estados locales de carga.

La compatibilidad de entrega depende del proveedor y del navegador; no se relaja el sandbox para sortear restricciones. El bloque nativo 4:1 requiere revisión visual con campañas reales y, para móvil, otro diseño aprobado por Adsterra. No se simula tráfico ni se hacen clics en anuncios durante las pruebas.

## Ámbito

Sin publicidad en salas, recursos, demo y páginas legales. La navegación a salas conserva una carga completa de documento para descartar cualquier runtime publicitario. El meta de verificación de AdSense y su declaración existente en ads.txt no cargan anuncios y se conservan; no se inventan entradas ads.txt de Adsterra.

Avisos actualizados: cookies, privacidad y preferencias en nueve idiomas. Este control técnico no es una certificación de cumplimiento ni sustituye las condiciones acordadas con los proveedores.

## Validación

Pruebas de navegador con respuestas publicitarias simuladas (sin impresiones reales): no hay solicitudes antes de consentimiento, rechazo persistente, elección de tamaño, nativo solo en escritorio, aislamiento, retirada y error de carga. Pruebas unitarias de caducidad y rechazo, TypeScript, ESLint, validación de los nueve catálogos y build.

Referencias: https://help-publishers.adsterra.com/en/articles/5210780-adding-ads-to-a-static-html-site y guía PDF aportada por el usuario.
