# Plantilla y generación de PDF

La plantilla activa es el formulario de **un ninja** `src/assets/pdf/fichas_rellenables.pdf`. El generador lo rellena tres veces, una por personaje, y compone las tres fichas en una página A4 estática sin bordes ni fondos de formulario. Las posiciones y dimensiones se leen de los campos y las notas del PDF; no se carga el JSON de coordenadas. El archivo de plantilla sigue siendo rellenable y no se modifica.

`JutsuPdfTemplate` recibe la URL base de los recursos locales y proporciona el mapeo de `JutsuFormFields`. Angular CLI copia `src/assets/` a `assets/` sin modificar los archivos. `PlatformAssetsService` resuelve esa base respecto al `<base href>` de la aplicación, también cuando se sirve desde una subcarpeta.

## Referencia y campos

El formulario contiene **15 campos de texto** en una página de **595,44 × 288 pt**. Todos usan el prefijo `Ninja1_`: cada copia recibe un ninja diferente antes de aplanarla. El mapeo conserva los nombres originales del PDF:

| Sufijo del campo | Propiedad del ninja |
| --- | --- |
| `name` | `name` |
| `technique_group` | `techniqueGroup.name` |
| `stats_attack` | `stats.attack` |
| `stats_defense` | `stats.defense` |
| `stats_movement` | `stats.movement` |
| `stats_hability` | `stats.skill` |
| `stats_chakra` | `stats.chakra` |
| `stats_life` | `stats.health` |
| `technique_1`, `technique_2`, `technique_3` | Las tres entradas de `techniqueGroup.techniques` |
| `technique_1_cost`, `technique_2_cost`, `technique_3_cost` | El valor `chakra` de cada técnica |
| `items_and_weapons` | `equipment.weapons` y `equipment.items` |

Por ejemplo, `Ninja1_items_and_weapons` combina el equipo del personaje que se está rellenando. El orden confirmado de los iconos es **ataque, defensa, movimiento, habilidad, chakra y vida**. El tipo de ninja no tiene un campo propio en esta plantilla.

La representación de valores sigue estas reglas:

- Los números conservan el cero; los datos sin seleccionar vacían el campo, incluido cualquier valor previo de la plantilla.
- Cada técnica ocupa un campo multilínea con nombre y descripción. Las menciones de Mokushin que forman parte de las reglas se conservan.
- El coste se escribe por separado en su campo `_cost`, junto al icono de chakra que ya forma parte del diseño. Admite números y texto: `0`, `5`, `1–3`, `1–5` y `3 + 1/round`. No se duplica en el cuerpo de la técnica.
- El inventario contiene los nombres de las armas y objetos, separados por comas, omitiendo los huecos vacíos.
- Los demás campos son de una sola línea.

El generador valida que los campos esperados existan, sean de texto y tengan widgets asociados a páginas y vinculados a su campo canónico. Rechaza nombres duplicados y widgets huérfanos. Actualiza tanto el valor `/V` como la apariencia `/AP` de cada widget.

`JutsuPdfTemplate.formOutput` es `flattened`: se omiten los bordes y fondos de las cajas, se incorporan las apariencias a la página y se eliminan los widgets y el árbol AcroForm. El visor ya no puede mostrar cajas de edición ni resaltarlas. Los marcos decorativos del diseño original se conservan. El texto sigue siendo vectorial, sin convertir la página en una imagen, y los cambios de personajes se hacen en la aplicación antes de volver a generar.

El motor también admite una ficha individual editable con `repeatedSheet: undefined` y `formOutput: 'editable'`. Las plantillas sin `formOutput` mantienen ese comportamiento editable. La composición de varias fichas exige `flattened`, para que sus campos no compartan valores. Las pruebas reabren ambos resultados: comparan los quince valores canónicos y heredados de cada ficha editable y comprueban que la exportación A4 contenga tres fichas independientes con quince apariencias cada una, sin bordes, widgets ni árbol de formulario. También verifican que la plantilla original no cambie.

## Marcadores de Mokushin

La posición de cada icono se define mediante una anotación PDF de tipo nota (`/Text`), cuyo **contenido** es uno de estos identificadores:

```text
Ninja1_technique_1_mokushin
Ninja1_technique_2_mokushin
Ninja1_technique_3_mokushin
```

Se ignoran espacios exteriores y diferencias entre mayúsculas y minúsculas; la plantilla actual mezcla `mokushin` y `Mokushin`. `PdfNoteMarkers` obtiene el rectángulo `/Rect`, valida que el marcador exista una sola vez y tenga dimensiones positivas, y elimina la nota y sus posibles ventanas emergentes. Las capas y bookmarks no intervienen.

Cuando `isMokushin` es verdadero, `PdfNoteIconRenderer` coloca `mokushin_ico.svg` centrado en ese rectángulo, conservando su proporción. En caso contrario, el espacio queda vacío. La plantilla no necesita una imagen fija de Mokushin y el PDF generado no muestra los iconos de nota. Los errores de marcadores o recursos indican el identificador y el ninja afectado.

El icono se carga desde `JutsuPdfTemplate.iconUrls` y se incrusta una sola vez por ficha, solo si alguna técnica lo utiliza. `PdfSvgIcon` conserva como vectores los trazados monocromos, grupos con transformaciones matriciales y regla de relleno del SVG de Affinity; omite su rectángulo transparente de referencia. Rechaza otros tipos de elementos y transformaciones para evitar una conversión parcial. No requiere DOM, canvas ni dependencias externas.

## Composición de la página

`JutsuPdfTemplate.repeatedSheet` declara tres copias en A4 (**595,28 × 841,89 pt**). `BandSheetPdfGenerator` toma los tres ninjas de la instantánea y rellena una copia independiente del formulario para cada uno, usando siempre los nombres `Ninja1_`. La plantilla, las fuentes y el SVG se solicitan una sola vez por generación, aunque cada ficha tiene su propio documento y sus valores.

Cada copia se aplana antes de incorporarla a la página final. `PdfSheetComposer` divide la página en tres espacios verticales iguales, ajusta cada ficha proporcionalmente y la centra dentro de su espacio. El orden de arriba abajo coincide con el del editor. Los textos y dibujos se incrustan como recursos vectoriales; no se rasterizan las fichas.

Una plantilla con más de una página, un número de ninjas distinto del esperado o un modo de salida editable produce un error en lugar de una composición parcial.

## Tipografía

La fuente principal es **Eagle Lake**, con su archivo local en `src/assets/fonts/Eagle_Lake/`. Sus símbolos ausentes se toman de **DejaVu Sans**. La fuente de respaldo solo se usa en los caracteres que no existen en la principal, por ejemplo → y ≥.

`JutsuFormFields` define la tipografía de cada campo. Los nombres parten de 14 pt, las estadísticas de 11 pt y los demás textos de 9 pt. Las técnicas se alinean arriba; las estadísticas y costes se centran. Los costes pueden reducirse hasta 4 pt para conservar íntegro `3 + 1/round` en la caja estrecha de la plantilla. Para aumentar su legibilidad, se puede ampliar esa caja en el PDF. La composición A4 aplica después una escala uniforme a cada ficha. Un estilo `typography` admite estas propiedades:

| Propiedad | Uso |
| --- | --- |
| `font` | Nombre de la fuente principal registrado en `JutsuPdfTemplate.fontUrls`. |
| `fallbackFonts` | Fuentes de respaldo para glifos ausentes. |
| `fontSize` | Tamaño inicial del texto. |
| `minFontSize` | Tamaño mínimo permitido al ajustar el contenido. |
| `fontSizeUnit` | `pt` para puntos PDF, o `px` si la referencia de la página también usa píxeles. |
| `lineHeight` | Distancia entre líneas; `null` usa las métricas de las líneas. Al reducir el tamaño se escala proporcionalmente. |
| `alignment` | `left`, `center` o `right`. |
| `verticalAlignment` | `top`, `middle` o `bottom`. |
| `color` | Color `#RRGGBB`. |

El compositor mide los glifos, divide líneas y reduce el tamaño dentro de los límites del campo, dejando un margen interior respecto al borde. Tiene en cuenta acentos, descendentes y salientes laterales. No recorta contenido: si no puede encajarlo al tamaño mínimo, la generación informa del campo afectado. El modo editable conserva los bordes y fondos de los campos; el estático los omite sin desplazar el texto. La plantilla actual no contiene widgets rotados; estos se rechazan con un error explícito.

Los tipos de letra se incrustan con `@pdf-lib/fontkit`: el modo estático incluye los glifos utilizados; el modo editable incluye las fuentes completas para admitir cambios posteriores. Las apariencias permiten combinar las dos fuentes en una misma línea. No se rasteriza la plantilla ni el texto. Las fuentes y sus licencias se incluyen en la aplicación; no se necesitan las etiquetas de Google Fonts para generar el PDF.

## Compatibilidad con coordenadas

Las plantillas que no declaran `formFields` ni `repeatedSheet` siguen usando el motor de coordenadas original. Se conserva `fichas_rellenables_coordenadas.json`, con sus 69 campos declarados y 54 activos, como referencia de la plantilla anterior de tres ninjas. Los quince pendientes siguen desactivados y sus metadatos de revisión se conservan. Ese JSON no corresponde a las dimensiones del formulario individual activo. La prueba de equivalencia del motor anterior usa un lienzo con las dimensiones originales, independiente del diseño actual.

En ese modo, `configUrl` apunta al JSON y la propiedad `pdf` del JSON se resuelve respecto a su URL. Las rutas como `ninjas.0.name` identifican los datos. `sources` permite combinar armas y objetos. Los formatos `text`, `number`, `boolean` y `list` conservan su comportamiento anterior.

Las cajas se introducen como `x`, `y`, `width` y `height`, desde la esquina superior izquierda de la página de referencia. `page: 0` es la primera página; las tres fichas actuales pertenecen a ella.

```text
scaleX = PDF.width / reference.width
scaleY = PDF.height / reference.height

pdfX      = PDF.originX + box.x * scaleX
pdfY      = PDF.originY + PDF.height - (box.y + box.height) * scaleY
pdfWidth  = box.width * scaleX
pdfHeight = box.height * scaleY
```

Se utilizan las dimensiones reales del `MediaBox`, incluidas sus coordenadas de origen. También se admiten otras plantillas con referencias en píxeles: deben declarar su ancho y alto reales en píxeles. No se presupone una resolución DPI ni una equivalencia entre píxeles y puntos.

El resultado de `AffinityCoordinateConverter.toPdfBox()` tiene origen inferior izquierdo. El compositor determina después la línea base con las métricas reales de la fuente; el borde inferior de la caja no se utiliza directamente como línea base.

## Responsabilidades de las clases

| Clase | Responsabilidad |
| --- | --- |
| `JutsuFormFields` | Nombres AcroForm, rutas del modelo y estilos de la ficha actual. |
| `BandFormPdfGenerator` | Validación del formulario y coordinación del rellenado. |
| `BandSheetPdfGenerator` | Generación independiente por ninja y reutilización de las cargas de recursos. |
| `PdfSheetComposer` | Composición proporcional de las fichas en una página. |
| `PdfFormValueFormatter` | Composición de técnicas y delegación de valores simples. |
| `PdfFormFieldRenderer` | Valores editables y apariencias vectoriales de los widgets. |
| `PdfIconProvider` | Carga y reutilización de iconos incrustados en el documento. |
| `PdfSvgIcon` | Conversión de los trazados SVG de Affinity a un recurso PDF vectorial. |
| `PdfNoteMarkers` | Lectura, validación y retirada de las notas que marcan iconos. |
| `PdfNoteIconRenderer` | Colocación del SVG dentro del rectángulo de una nota. |
| `PdfTemplateConfig` | Validación de campos, estilos, páginas y estado pendiente. |
| `PdfTemplateConfigLoader` | Lectura del JSON. |
| `PdfTemplateLoader` | Lectura de la plantilla PDF. |
| `PdfDocument` | Documento, páginas, fuentes incrustadas, aplanado y serialización. |
| `BandFieldResolver` | Lectura de una ruta sobre los datos de la banda. |
| `PdfFieldFormatter` | Conversión de valores a texto. |
| `PdfFontProvider` | Carga e incrustación de recursos de fuentes. |
| `PdfFontFamily` | Elección de glifos y cálculo de sus métricas. |
| `PdfTextLayout` | Líneas, ajuste de tamaño y posiciones del texto. |
| `PdfFieldRenderer` | Escritura del texto sobre la página. |
| `BandPdfGenerator` | Instantánea de datos y selección del motor de composición, formulario o coordenadas. |
| `JutsuPdfTemplate` | URLs y mapeo de campos de esta plantilla. |
| `PdfTemplatesService` | Catálogo de plantillas disponibles y selección independiente de la banda. |
| `PdfGenerationService` | Generación asíncrona, estado y bytes del último PDF válido. |
| `PdfFileName` | Nombre de archivo a partir del nombre de la banda. |
| `PdfBrowserFilesService` | Descargas, pestañas PDF y ciclo de vida de sus URLs temporales. |
| `PdfExportService` | Acciones de exportación del PDF vigente y mensajes de resultado. |

## Uso

En un módulo de la aplicación:

```ts
const template = new JutsuPdfTemplate(assetBaseUrl);
const bytes = await new BandPdfGenerator().generate(band, template);
```

El generador toma una copia JSON de la banda antes de cargar los recursos. Las clases del modelo conservan sus métodos y datos; la copia se utiliza únicamente para rellenar el documento. El PDF original no se modifica.

La acción **Generar y descargar PDF**, en la barra de iconos y al pie del editor, llama a `PdfExportService.generateAndDownload()`: espera a que `PdfGenerationService` guarde los bytes válidos e inicia su descarga. Si la generación falla o queda obsoleta, no intenta descargar. Los clics repetidos durante una generación se ignoran. `getPdfBytes()` devuelve una copia del último resultado válido o `null`. Las ediciones del formulario y los cambios de plantilla lo invalidan; un resultado que se termina de generar después de alguno de esos cambios se descarta, incluso si se vuelve a elegir la plantilla anterior. Seleccionar otra minificha para editar no modifica los datos ni invalida el resultado.

El icono **Descargar PDF** permite repetir la descarga de esos mismos bytes como un Blob `application/pdf`, con un enlace temporal. `PdfFileName` conserva Unicode, sustituye caracteres incompatibles y utiliza `jutsu-squad.pdf` si el nombre está vacío. El icono **Abrir PDF para imprimir** abre un Blob independiente de forma síncrona desde el clic y deja la impresión a los controles del visor. Un bloqueo de la pestaña se muestra como error y permite reintentar sin regenerar.

Las URLs de descarga se revocan a los 60 segundos. Las de impresión se conservan hasta detectar el cierre de su pestaña, aunque después se edite la banda. `PdfBrowserFilesService` libera URLs y temporizadores al destruir la aplicación. Los datos y los bytes siguen en memoria local; no se suben archivos ni se introduce persistencia.

## Plantillas disponibles

`PDF_TEMPLATE_OPTIONS`, en `pdf-templates.ts`, registra identificador, etiqueta y una función que crea los recursos de cada plantilla a partir de la base local. Solo está registrada la plantilla original **Jutsu — three ninjas per page**, según lo acordado para esta fase. El PDF de prueba de `public/templates/` no se ofrece como ficha.

Para incorporar otra plantilla real, añade su PDF a `src/assets/pdf/` y registra una opción con identificador único, fuentes y mapeo `formFields`. `formIcons` define las notas y sus indicadores; `repeatedSheet` permite componer las copias de los ninjas en una página. Si utiliza el motor de coordenadas, proporciona su JSON y omite `formFields` y `repeatedSheet`. `PdfTemplatesService` mantiene la selección fuera de `BandStateService`: cambiar el diseño no modifica los ninjas ni el nombre de la banda. El generador recibe la plantilla elegida como argumento y mantiene su independencia de Angular y del DOM.

## Edición de la configuración

1. Cambia las cajas en el propio PDF conservando los nombres de formulario. El generador utilizará las nuevas posiciones automáticamente.
   Para mover o redimensionar Mokushin, modifica el rectángulo de su nota y conserva su identificador en el contenido de la nota.
2. Para renombrar campos, cambiar su contenido o ajustar tamaños de letra, edita `JutsuFormFields`.
3. Para añadir una fuente, incluye su archivo local y registra su URL en `JutsuPdfTemplate.fontUrls`.
   Los iconos PDF se registran en `JutsuPdfTemplate.iconUrls`; Mokushin utiliza el mismo SVG que el editor.
4. Solo para plantillas de coordenadas: edita sus cajas o estilos en el JSON; para activar un campo pendiente, completa su caja y cambia `enabled` a `true`.

En la configuración de coordenadas, `null` sigue significando un dato pendiente; no equivale a cero. `getPendingPages()`, `getPendingFields()` e `isReady()` permiten revisar el estado. `assertReady()` rechaza cualquier configuración activa incompleta antes de cargar el PDF.
