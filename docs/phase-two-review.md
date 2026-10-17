# Segunda fase · 17 de octubre de 2026

## Valor añadido

Biblioteca de seis guías completas en español, inglés, francés, italiano, alemán, portugués, catalán, euskera y ruso. Las tres guías nuevas son:

- `/recursos/dividir-historias`: cortes verticales, criterios de aceptación y tres casos originales antes/después.
- `/recursos/interpretar-resultados`: media, mediana, distribución y cartas especiales. Comparador interactivo con cuatro escenarios y los mismos cálculos que las salas.
- `/recursos/sesiones-remotas`: preparación, tiempos, participación y cierre, con un caso antes/después.

Los casos están identificados como ficticios. No se presentan como clientes ni resultados reales. Cada guía incluye fuentes, enlaces relacionados, autoría editorial, fecha y datos estructurados Article/BreadcrumbList. Los textos están disponibles sin JavaScript. Se mantienen canónicas, hreflang y sitemap en los nueve idiomas: 90 páginas de recursos en total, sin publicidad.

## Medición disponible

`POST /api/resource-usage` acepta exclusivamente evento, idioma e identificador fijo del recurso. Cuenta visitas a recursos, llegada al final de una guía, inicio/final de demo, copia/descarga/impresión de plantilla, clic hacia creación y creación de sala completada. Una impresión significa abrir el diálogo, no confirmar una impresión física.

La tabla `public.resource_usage_daily` agrupa por día UTC, evento, idioma y recurso. No registra identificadores de personas, sesiones, salas, votos, texto editado ni direcciones IP. No usa cookies ni almacenamiento local. Respeta Do Not Track y Global Privacy Control; omite bots reconocidos y entornos de desarrollo/preview. El limitador mantiene hashes con sal por instancia durante un minuto como máximo y limita memoria; no es una defensa distribuida frente a tráfico artificial.

Los contadores representan acciones, no visitantes únicos, lectura confirmada ni conversiones atribuidas entre páginas. Pueden incluir repeticiones o automatización no reconocida. No existe una línea base histórica anterior a este despliegue. Revisar qué guías se usan, dónde se abandona la demo y qué recursos generan acciones antes de decidir el próximo contenido; no presentar estas señales como un umbral de aprobación de Google.

Consulta del propietario, con variables de servidor configuradas en `.env.local`:

```bash
node scripts/resource-usage-report.mjs 30
```

También puede ejecutarse `scripts/resource-usage-report.sql` en el editor SQL autorizado. `SUPABASE_SERVICE_ROLE_KEY` es exclusivamente de servidor, nunca debe llevar prefijo NEXT_PUBLIC. La tabla tiene RLS, sin permisos para anon/authenticated y sin políticas de acceso público; solo service_role puede ejecutar la función SECURITY INVOKER o consultar los totales. La migración `20261017182914_resource_usage_daily.sql` ya se ha aplicado al proyecto de StoryFlop. Se verificaron permisos y un incremento transaccional con rollback.

El aviso informativo se traduce en los nueve idiomas y la política de privacidad describe estos contadores. Se eliminan agregados de más de 400 días al registrar la siguiente acción. La analítica pública existente elimina consultas y fragmentos y descarta rutas o referencias de salas privadas, además de DNT/GPC.

El asesor de seguridad señala de forma informativa RLS sin políticas en esta tabla: es intencional al no ofrecer acceso a visitantes. Los avisos preexistentes de funciones de salas quedan fuera de este cambio. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Revisión de AdSense e indexación

La cuenta de AdSense accesible mantiene el estado «Requiere su atención / Contenido de poco valor», con ads.txt autorizado. El detalle no identifica URL concretas adicionales. No se ha marcado como resuelto ni solicitado una nueva revisión. No se han cambiado exclusiones de Auto ads ni ajustes de consentimiento; siguen pendientes de comprobar según `docs/adsense-review.md`.

La sesión de Search Console muestra que no tiene acceso a la propiedad de dominio `storyflop.com`. No se pueden confirmar cobertura, rastreos o indexación desde esta cuenta y no se ha creado otra propiedad. La auditoría pública comprueba accesibilidad técnica, no inclusión en el índice de Google ni aprobación de AdSense:

```bash
node scripts/audit-resource-site.mjs https://storyflop.com
```

Comprueba las 90 URL, HTTP 200, idioma, contenido HTML, canónica, alternancias, datos estructurados, sitemap y ausencia de runtime publicitario en recursos. No sustituye la inspección de URL de Search Console.

## Validación

145 pruebas unitarias; 82 pruebas de navegador sobre compilación de producción, escritorio y móvil, incluyendo los nueve idiomas, demo, plantilla, casos, cálculo, privacidad y navegación publicitaria. TypeScript, ESLint y build de Next.js. La auditoría pública se repite tras el despliegue.
