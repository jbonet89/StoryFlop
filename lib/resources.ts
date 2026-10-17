export const resourceDate = "2026-10-17";

export const guides = [
  {
    slug: "primera-sesion",
    title: "Tu primera sesión de Planning Poker con StoryFlop",
    description: "Prepara una historia, reparte los roles y recorre una ronda completa: desde el voto privado hasta la decisión del equipo.",
    category: "Empezar",
    sections: [
      { id: "preparar", title: "1. Llega con una historia que se pueda discutir", paragraphs: [
        "Antes de abrir la sala, escribe el resultado que necesita la persona usuaria y cómo comprobaréis que funciona. «Mejorar el acceso» puede significar muchas cosas. «Recuperar el acceso mediante un enlace de correo que caduca» permite hablar de un comportamiento concreto.",
        "Para practicar, usaremos una recuperación de contraseña. El servicio de correo ya existe. El enlace debe caducar, solo puede utilizarse una vez y debe mostrar un mensaje comprensible cuando deja de ser válido. Cambiar de proveedor de correo queda fuera. Este caso es ficticio: su estimación no es una referencia universal.",
        "Llevad también una historia terminada que el equipo conozca. Sirve para comparar tamaño relativo, incluyendo pruebas y revisión. Si nadie entiende el trabajo o falta una decisión que cambia mucho su alcance, anotad la pregunta antes de votar."
      ], checklist: ["Resultado esperado y criterios de aceptación", "Dependencias y elementos fuera de alcance", "Una historia conocida como referencia"] },
      { id: "sala", title: "2. Crea la sala y acuerda quién hace qué", paragraphs: [
        "En la portada, selecciona Crear sala, introduce el nombre de la sesión, tu nombre y un avatar. Comparte el enlace o el código con las personas invitadas. Cada participante entra desde su propio navegador; no necesita registrarse.",
        "El organizador conduce la ronda y revela los votos. Puede nombrar colaboradores para ayudar con las historias y las rondas. Quien vaya a estimar participa como votante; quien solo necesite seguir la conversación puede actuar como observador. Revisad esa elección antes de empezar.",
        "Añade la historia con su título, descripción y, si resulta útil, un enlace a vuestra tarea. Compartid solo información que estéis autorizados a introducir. Guardad las decisiones duraderas en vuestro sistema de trabajo: StoryFlop utiliza salas temporales."
      ] },
      { id: "votar", title: "3. Aclara el alcance y vota sin anunciar tu número", paragraphs: [
        "Lee la historia y deja espacio para preguntas. ¿El correo ya está disponible? ¿Hay que impedir reutilizar el enlace? ¿Quién verifica el mensaje de caducidad? Cuando todos estén estimando el mismo alcance, abrid la ronda y elegid una carta de forma independiente.",
        "StoryFlop ofrece 0, 1, 2, 3, 5, 8, 13, 21 y 34, además de ? y la pausa. Los valores representan comparaciones del equipo, no un número fijo de horas. Si falta información, la carta ? ayuda a hacer visible esa duda; no hace falta inventar precisión.",
        "Esperad a los votantes antes de revelar. Decir «para mí es un 5» mientras los demás eligen puede condicionar sus respuestas. La utilidad de votar en privado consiste en conservar perspectivas distintas hasta la conversación."
      ] },
      { id: "acordar", title: "4. Revela, conversa y registra la decisión", paragraphs: [
        "Imagina que aparecen 3, 5 y 13. Pregunta primero qué trabajo ha incluido cada persona. En nuestro caso, quien votó 13 pensaba que había que crear el servicio de correo, mientras que quien votó 3 no había contado las pruebas de caducidad. Las cartas permiten descubrir esas diferencias.",
        "Aclarad que el servicio ya existe y que las pruebas forman parte de la historia. Si esa conversación cambia lo que entendéis, repetid la votación. En el ejemplo, el equipo puede acordar 5; otro equipo, con otras referencias, podría acordar un valor distinto.",
        "Registrad la estimación final y los supuestos relevantes. Si no hay acuerdo, podéis dividir la historia o encargar una investigación con una pregunta concreta. El promedio de votos describe lo que ha ocurrido, pero no decide el alcance por vosotros."
      ] },
      { id: "cerrar", title: "5. Cierra con una comprobación útil", paragraphs: [
        "Antes de pasar a la siguiente historia, pregunta: «¿Qué acabamos de descubrir que no estaba escrito?». Anota esa información en la tarea. El resultado de la sesión debería incluir una historia más clara, además de una cifra.",
        "Al terminar, recuperad del historial las decisiones que necesitéis y trasladadlas a vuestro backlog. Las salas inactivas y sus datos asociados se eliminan después de 14 días. Para la siguiente sesión, conservad las referencias que todavía representen vuestro trabajo y revisad las que hayan dejado de ser útiles.",
        "Planning Poker es una técnica que podéis utilizar en vuestro contexto. La Guía Scrum no exige usar cartas ni puntos de historia. Adaptad la sesión para que ayude a comprender el trabajo, sin convertir la votación en una obligación sin propósito."
      ] }
    ],
    sources: [{ label: "James Grenning: Planning Poker, artículo original", url: "https://wingman-sw.com/articles/planning-poker" }, { label: "Guía Scrum: Product Backlog y refinamiento", url: "https://scrumguides.org/scrum-guide.html#product-backlog" }]
  },
  {
    slug: "resolver-desacuerdos",
    title: "Votos 3, 5 y 13: cómo resolver el desacuerdo",
    description: "Un caso de recuperación de contraseña para aprender a distinguir diferencias de alcance, incertidumbre y referencias del equipo.",
    category: "Facilitar",
    sections: [
      { id: "caso", title: "El caso: la misma frase, tres trabajos diferentes", paragraphs: [
        "«Permitir recuperar la contraseña por correo». En esta situación ficticia, Ana vota 3, Bruno 5 y Cris 13. La media es 7 y la mediana es 5. Ninguno de esos dos números explica qué ha entendido cada persona.",
        "Ana supone que existe una pantalla reutilizable y que el correo ya está resuelto. Bruno incluye el tratamiento de enlaces caducados y sus pruebas. Cris entiende que hay que contratar e integrar un proveedor de correo. Votar otra vez sin aclararlo solo repetiría el problema.",
        "El objetivo de quien facilita es averiguar qué contiene cada estimación. Evita preguntar «¿por qué has votado tan alto?», porque puede sonar a una petición de rebajar el número. Prueba con «¿qué pasos y riesgos has incluido?»."
      ] },
      { id: "preguntas", title: "Tres preguntas que convierten cifras en información", paragraphs: [
        "Primero: «¿Qué das por hecho que ya existe?». Revisad componentes, permisos, servicios y datos. En el caso, basta confirmar que existe un servicio de correo para eliminar una diferencia importante de alcance.",
        "Segundo: «¿Qué tiene que pasar para considerar la historia terminada?». Escribid los comportamientos verificables: el enlace caduca, no se reutiliza y los mensajes se entienden. Una estimación que solo contempla la implementación de la pantalla no representa el mismo trabajo que otra que incluye esas comprobaciones.",
        "Tercero: «¿Qué desconocemos y cómo podemos averiguarlo?». Si nadie sabe si el proveedor permite invalidar enlaces, formulad esa pregunta y asignad una investigación acotada. No ocultéis una incertidumbre grande detrás de una cifra precisa."
      ], checklist: ["Qué existe y puede reutilizarse", "Qué incluye la definición de terminado del equipo", "Qué falta conocer y quién lo aclarará"] },
      { id: "decidir", title: "Decide entre aclarar, dividir o investigar", paragraphs: [
        "Aclarar sirve cuando la diferencia era una interpretación. En nuestro ejemplo, se confirma el servicio existente y se incorporan las pruebas a la descripción. Todos pueden volver a estimar el mismo trabajo.",
        "Dividir sirve cuando aparecen resultados separables. Podéis entregar primero la recuperación por correo para cuentas existentes y tratar otro canal de recuperación como una historia distinta, siempre que cada parte tenga utilidad y cumpla vuestros criterios de calidad. Separar «programar» de «probar» no resuelve por sí solo el tamaño de una entrega.",
        "Investigar sirve cuando una pregunta técnica o de producto impide estimar con sentido. Definid qué evidencia necesitáis, quién la buscará y cuándo revisaréis el resultado. La investigación debe permitir una decisión posterior, no convertirse en un cajón donde aplazar una historia indefinidamente."
      ] },
      { id: "segunda-ronda", title: "Repite la ronda cuando haya información nueva", paragraphs: [
        "Después de aclarar el alcance, volved a elegir cartas en privado. Supongamos que ahora aparecen 5, 5 y 5. El acuerdo refleja una comprensión más cercana, aunque no garantiza que no aparezcan imprevistos durante la ejecución.",
        "Si aparecen 5, 5 y 8, preguntad si sigue habiendo un supuesto diferente. No es necesario encadenar rondas hasta que alguien ceda. El equipo puede acordar cómo proceder, documentar el riesgo o decidir que necesita una división adicional.",
        "En StoryFlop podéis consultar la distribución y el historial. Usadlos para recordar la conversación. Evitad convertir el promedio en la estimación final de forma automática: una media puede quedar entre cartas y no representa una decisión compartida."
      ] },
      { id: "registro", title: "Qué escribir en la tarea después de la conversación", paragraphs: [
        "Un registro útil sería: «Recuperación por correo usando el servicio existente. Incluye enlace de un solo uso, caducidad y pruebas de error. No incluye sustituir al proveedor. Estimación acordada: 5. Revisar si cambia el servicio disponible». Es un ejemplo didáctico, no una estimación aplicable a cualquier implementación.",
        "Si utilizáis los puntos para comparar personas o exigir que todos estimen igual desde el principio, desaparecerá parte de la información que buscabais. Las discrepancias son útiles cuando revelan trabajo oculto y permiten tomar una decisión.",
        "En la siguiente sesión, observad si las mismas preguntas vuelven a aparecer. Si ocurre, incorporadlas a la preparación de historias. Una mejora concreta del proceso vale más que conseguir una mesa llena de cartas iguales."
      ] }
    ],
    sources: [{ label: "James Grenning: origen y propósito de Planning Poker", url: "https://wingman-sw.com/articles/planning-poker" }]
  },
  {
    slug: "historias-listas-para-estimar",
    title: "Historias de usuario listas para estimar",
    description: "Tres ejemplos trabajados para descubrir alcance, pruebas y dependencias antes de elegir una carta.",
    category: "Preparar",
    sections: [
      { id: "preparacion", title: "Preparar no significa conocer todos los detalles", paragraphs: [
        "Una historia lista para conversar tiene un resultado comprensible, límites y preguntas visibles. No necesita una especificación exhaustiva. El refinamiento ayuda precisamente a descomponer y aclarar el trabajo conforme aprendéis sobre él.",
        "Los siguientes ejemplos son ficticios y están creados para practicar. No les asignamos puntos predeterminados: el tamaño depende del producto, las dependencias, las prácticas de calidad y las referencias del equipo. Empezad por preguntar qué entendéis que hay que entregar.",
        "Esta lista es una ayuda de preparación, no una regla oficial de Scrum ni una barrera para conversar sobre trabajo todavía incierto. Cuando una historia no se puede estimar, también es útil salir con una pregunta mejor formulada."
      ] },
      { id: "busqueda", title: "Ejemplo 1: buscar pedidos por referencia", paragraphs: [
        "Resultado: una persona de soporte encuentra un pedido introduciendo su referencia completa. La API ya admite esa búsqueda y existe un campo de búsqueda reutilizable. Quedan fuera las coincidencias parciales y los nuevos filtros.",
        "Criterios de aceptación: una referencia válida muestra el pedido autorizado; una referencia inexistente muestra un estado vacío; un fallo de red ofrece reintentar sin perder el texto. La búsqueda debe poder utilizarse con teclado y mostrar una etiqueta comprensible.",
        "Antes de votar, preguntad cómo se comprueban los permisos, qué ocurre con espacios al pegar una referencia y si las pruebas de la API cubren el contrato que necesita la pantalla. Si la API no existe, ya no estáis estimando el alcance descrito al principio.",
        "Comparad con una búsqueda similar terminada. Si esta incorpora un nuevo modelo de permisos, explicitad la diferencia. El parecido visual entre dos pantallas no basta para afirmar que tienen el mismo tamaño."
      ] },
      { id: "notificaciones", title: "Ejemplo 2: desactivar un correo de resumen", paragraphs: [
        "Resultado: una persona con cuenta puede desactivar el resumen semanal desde sus preferencias. Se mantienen los correos necesarios para recuperar el acceso. Queda fuera elegir una frecuencia personalizada.",
        "Criterios de aceptación: la preferencia se conserva al volver a entrar; el proceso de envío respeta el cambio; un error al guardar permite recuperar el estado anterior. El equipo debe decidir qué ocurre si el resumen ya está en la cola de envío.",
        "La incertidumbre principal puede estar en el proceso que envía correos, no en el interruptor de la interfaz. Invitad a quien conozca ese proceso a aclararlo antes de estimar. Si falta información sobre las colas, definid una investigación sobre ese comportamiento.",
        "Para dividir, podéis empezar por una preferencia binaria y dejar frecuencias adicionales para otra historia. Cada parte debería poder comprobarse de principio a fin. Separar la interfaz del proceso de envío dejaría una preferencia que aparenta funcionar sin modificar los correos."
      ] },
      { id: "exportacion", title: "Ejemplo 3: exportar los resultados de un informe", paragraphs: [
        "Resultado: una persona autorizada descarga en CSV los resultados filtrados de un informe. Esta es una historia de un producto ficticio, no una funcionalidad anunciada de StoryFlop. El archivo contiene las columnas acordadas y una cabecera legible.",
        "Antes de votar, concretad el volumen esperado, el formato de fechas, los caracteres especiales y los permisos. ¿Se exporta la página visible o todo el resultado filtrado? ¿Qué ve la persona mientras espera? Dos respuestas distintas pueden implicar soluciones muy diferentes.",
        "Criterios de aceptación: el archivo corresponde a los filtros aplicados; conserva acentos; se abre correctamente en la herramienta objetivo; y no expone filas que la persona no puede consultar. Incluid las comprobaciones de seguridad y el tratamiento seguro de valores interpretables como fórmulas.",
        "Si el volumen hace incierto el enfoque, investigad con un conjunto de datos representativo y autorizado. Una posible división es entregar primero un alcance de exportación explícitamente limitado que siga resolviendo una necesidad real, en lugar de prometer una exportación completa sin conocer su coste."
      ] },
      { id: "comprobacion", title: "La comprobación común antes de votar", paragraphs: [
        "Pedid a dos participantes que expliquen la historia con sus palabras. Si describen resultados distintos, aclaradlos antes de comparar cartas. Después revisad pruebas, revisión, permisos y dependencias: forman parte del trabajo que el equipo necesita terminar.",
        "Registrad lo que queda fuera para evitar que reaparezca como un supuesto durante la ronda. Si una pregunta puede cambiar mucho la solución, acordad quién la resolverá y cuándo volveréis a revisar la historia.",
        "Usad la plantilla de refinamiento para conservar esas respuestas. Una vez definido el alcance, podéis llevar el título y la descripción a una sala de StoryFlop. Tras la conversación, trasladad el acuerdo a vuestro backlog para mantener el contexto cuando empiece el trabajo."
      ], checklist: ["Podemos explicar el resultado esperado", "Sabemos cómo comprobarlo", "Hemos hecho visibles dependencias, límites y preguntas"] }
    ],
    sources: [{ label: "Guía Scrum: refinamiento del Product Backlog", url: "https://scrumguides.org/scrum-guide.html#product-backlog" }]
  }
];

export const templateText = `PLANTILLA DE REFINAMIENTO · STORYFLOP

Sesión / fecha:
Participantes y facilitador:
Historia de referencia del equipo:

HISTORIA
Título:
Persona usuaria y resultado esperado:
Criterios de aceptación (comportamientos comprobables):
1.
2.
3.
Fuera de alcance:
Dependencias y componentes disponibles:
Pruebas, revisión y condiciones de calidad:
Preguntas abiertas / responsable / siguiente revisión:

CONVERSACIÓN
Votos iniciales:
Supuestos detrás del voto menor y mayor:
Información nueva o cambio de alcance:
Decisión: aclarar / dividir / investigar / acordar
Segunda ronda (si aporta información):
Estimación acordada (o motivo para aplazarla):
Riesgos y supuestos que acompañan el acuerdo:
Dónde se registra la decisión en el backlog:

CIERRE
¿Qué descubrimos que no estaba escrito?
¿Qué mejoraremos en la siguiente preparación?

Uso: copia una ficha HISTORIA y CONVERSACIÓN por cada elemento.
Los puntos son relativos al equipo; no equivalen a horas ni miden el rendimiento individual.
Recurso: https://storyflop.com/recursos/plantilla-refinamiento
`;
