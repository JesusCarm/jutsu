# Plantilla y generación de PDF

La configuración activa es `fichas_rellenables_coordenadas.json`, junto a `fichas_rellenables.pdf`. La propiedad `pdf` es `./fichas_rellenables.pdf`, relativa al JSON. `JutsuPdfTemplate` recibe la URL base de los recursos locales. Angular CLI copia `src/assets/` a `assets/` sin modificar los archivos. `PlatformAssets` resuelve esa base respecto al `<base href>` de la aplicación, también cuando se sirve desde una subcarpeta.

## Referencia y campos

Se usa el archivo de coordenadas aportado en `src/assets/pdf/`, cuya referencia es **595,44 × 841,92 pt**, con origen superior izquierdo. Sus metadatos `positionStatus`, `positionNote`, `coordinateNotes` y `extractionNotes` se conservan para facilitar la revisión.

Los 69 identificadores son rutas de propiedades del modelo, por ejemplo:

- `ninjas.0.name`
- `ninjas.1.stats.chakra`
- `ninjas.2.techniqueGroup.techniques.0.description`
- `ninjas.0.equipment.items`

El orden confirmado de los iconos es **ataque, defensa, movimiento, habilidad, chakra y vida**. Las posiciones de los campos y las listas originales de estadísticas se han asignado con ese mismo orden.

Hay 54 campos activos. Los 15 sin caja se conservan con `enabled: false`: los tres tipos de ninja, nueve indicadores gráficos de Mokushin y tres bloques separados de armas. Las técnicas mantienen la indicación de Mokushin en su descripción.

El campo de inventario de cada ninja declara `sources` para combinar sus armas y objetos en una sola línea. Su `id` sigue correspondiendo a una propiedad del modelo:

```json
"sources": ["ninjas.0.equipment.weapons", "ninjas.0.equipment.items"]
```

La representación de valores sigue estas reglas:

- `text`: conserva el texto, incluidos costes como `1–5` y `3 + 1/round`.
- `number`: conserva el cero; un valor sin seleccionar produce un campo vacío.
- `boolean`: imprime `Mokushin` si es verdadero y deja el campo vacío si es falso.
- `list`: imprime los nombres de las entradas, separados por comas; las entradas vacías se omiten.

En la fase 5, anterior a esta migración, se ajustaron algunos rectángulos estimados de títulos, descripciones e inventario inferior para que no cruzasen los marcos. La migración conserva esos valores sin cambios. Las posiciones revisadas usan `positionStatus: "render-checked"`.

## Tipografía

La fuente principal es **Eagle Lake**, con su archivo local en `src/assets/fonts/Eagle_Lake/`. Sus símbolos ausentes se toman de **DejaVu Sans**. La fuente de respaldo solo se usa en los caracteres que no existen en la principal, por ejemplo → y ≥.

`typography` define el estilo general. Un campo puede declarar un objeto `typography` con las propiedades que cambien:

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

El compositor mide los glifos, divide líneas y reduce el tamaño dentro de los límites del campo. Tiene en cuenta acentos, descendentes y salientes laterales. No recorta contenido: si no puede encajarlo al tamaño mínimo, la generación informa del campo afectado. Los costes largos pueden necesitar tamaños menores que los textos descriptivos debido al ancho de su caja.

Los tipos de letra se incrustan con `@pdf-lib/fontkit`. No se rasteriza la plantilla ni el texto. Las fuentes y sus licencias se incluyen en la aplicación; no se necesitan las etiquetas de Google Fonts para generar el PDF.

## Conversión de coordenadas

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
| `PdfTemplateConfig` | Validación de campos, estilos, páginas y estado pendiente. |
| `PdfTemplateConfigLoader` | Lectura del JSON. |
| `PdfTemplateLoader` | Lectura de la plantilla PDF. |
| `PdfDocument` | Documento, páginas, fuentes incrustadas y serialización. |
| `BandFieldResolver` | Lectura de una ruta sobre los datos de la banda. |
| `PdfFieldFormatter` | Conversión de valores a texto. |
| `PdfFontProvider` | Carga e incrustación de recursos de fuentes. |
| `PdfFontFamily` | Elección de glifos y cálculo de sus métricas. |
| `PdfTextLayout` | Líneas, ajuste de tamaño y posiciones del texto. |
| `PdfFieldRenderer` | Escritura del texto sobre la página. |
| `BandPdfGenerator` | Coordinación de la generación. |
| `JutsuPdfTemplate` | URLs de los recursos de esta plantilla. |
| `PdfGeneration` | Botón, estado visible y bytes del último PDF válido. |

## Uso

En un módulo de la aplicación:

```ts
const template = new JutsuPdfTemplate(assetBaseUrl);
const bytes = await new BandPdfGenerator().generate(band, template);
```

El generador toma una copia JSON de la banda antes de cargar los recursos. Las clases del modelo conservan sus métodos y datos; la copia se utiliza únicamente para rellenar el documento. El PDF original no se modifica.

El botón **Generate PDF** ejecuta este flujo y guarda los bytes en `PdfGeneration`. `getPdfBytes()` devuelve una copia del último resultado válido o `null`. Las ediciones del formulario lo invalidan; un resultado que se termina de generar después de otra edición se descarta.

La fase 5 no crea enlaces de descarga, ventanas de impresión ni un selector de plantillas. El PDF permanece en memoria hasta la siguiente generación, una edición o la recarga de la página.

## Edición de la configuración

1. Edita únicamente `src/assets/pdf/fichas_rellenables_coordenadas.json` para cambiar cajas o estilos de esta plantilla.
2. Para activar un campo pendiente, completa su caja y cambia `enabled` a `true`.
3. Para añadir una fuente, incluye su archivo local y registra su URL en `JutsuPdfTemplate.fontUrls`.
4. Las posiciones deben quedar dentro de la página; `width` y `height` deben ser mayores que cero.

`null` sigue significando un dato pendiente; no equivale a cero. `getPendingPages()`, `getPendingFields()` e `isReady()` permiten revisar el estado. `assertReady()` rechaza cualquier configuración activa incompleta antes de cargar el PDF.
