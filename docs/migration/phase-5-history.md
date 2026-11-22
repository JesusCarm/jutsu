> Documento histórico anterior a la migración. Las rutas y órdenes siguientes describen la versión Vite; consulta el README raíz para la aplicación Angular actual.

# Jutsu Band Builder

Aplicación web de Gipsy Games para crear bandas de tres ninjas de Jutsu y generar sus fichas. Desarrollo incremental con JavaScript vanilla, HTML y CSS, usando Vite.

## Estado: fase 5

El botón **Generate PDF** toma una copia de los datos de la banda, carga la plantilla y el JSON, y genera la ficha completa en memoria. El resultado es un `Uint8Array`; la descarga, impresión y selección de plantillas siguen reservadas para la fase 6.

La configuración activa es **`src/pdf/fichas_rellenables_coordenadas.json`**, junto al PDF original. La guía de edición, las fórmulas y las responsabilidades de las clases están en [src/pdf/README.md](src/pdf/README.md).

Se utiliza la versión con coordenadas aportada en `src/pdf/`: su referencia mide **595,44 × 841,92 pt**. Contiene 69 campos, de los que 54 se imprimen. Los 15 sin posición se conservan con `enabled: false`: tipo de ninja, indicadores independientes de Mokushin y listas de armas independientes. Las armas y objetos se combinan en una sola línea de inventario por ninja. Las técnicas conservan la mención de Mokushin en sus descripciones. Los títulos, las descripciones y el inventario inferior estimados se han ajustado tras revisar el PDF renderizado.

Integración de `pdf-lib` mediante dos clases independientes: carga de plantillas y gestión de documentos. Se utiliza la plantilla proporcionada en `src/pdf/fichas_rellenables.pdf`. El documento se puede inspeccionar, preparar para insertar texto y guardar en memoria como `Uint8Array`. Se conserva una plantilla auxiliar de dos páginas para probar documentos con tamaños distintos.

El formulario de la fase 2 conserva el siguiente comportamiento:

Formulario responsive para una banda de exactamente tres ninjas. Cada ninja incluye:

- Nombre y tipo: Physical, Defensive, Offensive o Jutsu Master.
- Estadísticas de solo lectura: attack, defense, movement, skill, chakra y health. El tipo de ninja seleccionado define sus valores, que se muestran al lado de su nombre, sin cajas de entrada.
- Un grupo entre los doce disponibles, con un total de 36 técnicas. El grupo define exactamente tres técnicas de solo lectura, con nombre, descripción breve, coste de chakra y Mokushin.
- Selección de tres armas disponibles y cuatro objetos disponibles mediante desplegables. Sus descripciones y costes en acciones son de solo lectura. El máximo por ninja es de **tres armas y dos objetos**.

Los cambios actualizan inmediatamente una instancia de `Band`. `src/main.js` crea la banda y el catálogo de juego, y se los entrega a `BandForm`. Los modelos no dependen del DOM ni de las plantillas.

Los selectores empiezan vacíos. Antes de escoger un tipo, las estadísticas son `null` y se muestran como «—». Antes de escoger un grupo, no hay técnicas asignadas. Las estadísticas, técnicas y entradas de equipamiento seleccionadas son inmutables. Cero se conserva como valor numérico y Mokushin como booleano. Los costes de chakra también admiten expresiones de texto: se conservan literalmente «1–5», «1–3» y «3 + 1/round».

Cambiar de tipo sustituye sus estadísticas y cambiar de grupo sustituye las tres técnicas. El nombre y las demás selecciones del ninja se conservan. Los límites de equipamiento se aplican en el modelo y en la interfaz. Las filas de selección vacías también ocupan una de las tres o dos plazas; pueden eliminarse. Los datos permanecen en memoria mientras la página está abierta y se reinician al recargarla.

### Catálogo de juego

Los cuatro perfiles están en `src/data/ninja-types.json`, las técnicas en `src/data/technique-groups.json` y las armas y objetos en `src/data/equipment.json`. Los datos proceden de los valores facilitados. `src/data/game-data.js` reúne esos catálogos para entregarlos a `GameCatalog`.

Las listas numéricas de los perfiles se asignan en el orden confirmado de los iconos: **attack, defense, movement, skill, chakra, health**. El JSON guarda cada valor con su nombre para evitar depender de la posición de una lista al mantener los datos.

| Tipo | Attack | Defense | Movement | Skill | Chakra | Health |
| --- | --- | --- | --- | --- | --- | --- |
| Physical | 6 | 5 | 7 | 4 | 12 | 10 |
| Defensive | 4 | 6 | 5 | 5 | 12 | 10 |
| Offensive | 8 | 3 | 7 | 4 | 15 | 10 |
| Jutsu Master | 5 | 4 | 5 | 5 | 20 | 10 |

Al escoger un tipo se muestran inmediatamente sus seis valores como texto de solo lectura. Si se elimina la selección, vuelven a mostrarse como «—». `GameCatalog` mantiene la posibilidad de devolver un perfil sin valores si en el futuro falta una definición, sin bloquear la selección ni conservar números del tipo anterior.

| Lista | Contenido de cada definición |
| --- | --- |
| `ninjaTypes` | `name` y `stats`, con las seis estadísticas numéricas cuando estén disponibles. |
| `techniqueGroups` | `name` y `techniques`, con exactamente tres definiciones: `name`, `description`, `chakra` numérico o textual e `isMokushin` booleano. |
| `weapons` | `name`, `description` y `cost` como texto, por ejemplo «1 action». |
| `items` | `name`, `description` y `cost` como texto. |

Los nombres de tipos y grupos deben coincidir con `src/data/ninja-options.js`. Las selecciones de equipamiento usan el nombre como identificador dentro de su lista. No se ha añadido una restricción para impedir selecciones repetidas, ya que esa regla no se ha indicado.

En el archivo de técnicas, el campo `cost` del texto recibido se ha guardado como `chakra` conservando su contenido. `isMokushin` se ha marcado en las técnicas cuya descripción menciona explícitamente Mokushin, incluidas las de uso «Action/Mokushin». Una descripción que solo indica «Reaction» no se ha marcado como Mokushin. Estos indicadores están guardados explícitamente en el JSON y se pueden corregir allí si las reglas requieren alguna excepción.

El botón **Generate PDF** muestra los estados de generación, éxito y error. Una edición posterior invalida el PDF anterior. Si la banda cambia mientras se está generando, ese resultado se descarta. Al recargar la página se pierden tanto los datos de la banda como el PDF en memoria.

Vite es la única dependencia de desarrollo. `pdf-lib` gestiona los documentos y `@pdf-lib/fontkit` permite incrustar las fuentes TrueType con sus caracteres Unicode. El generador y sus librerías se cargan al pulsar el botón, mediante importación dinámica.

La fuente principal es **Eagle Lake**, usando el archivo facilitado en `src/fonts/Eagle_Lake/EagleLake-Regular.ttf`. Para símbolos que no contiene, como → y ≥, se usa DejaVu Sans únicamente en esos caracteres. Ambas fuentes se sirven desde la aplicación; no se solicitan a Google Fonts. Las licencias se incluyen en `public/licenses/`.

## Integración PDF

`BandPdfGenerator.generate(band, template)` devuelve una promesa con los bytes del PDF. Las clases de resolución de datos, formato, fuentes, composición del texto y escritura se mantienen separadas. El generador no accede al DOM.

```js
import { BandPdfGenerator } from './src/pdf/BandPdfGenerator.js';
import { JutsuPdfTemplate } from './src/pdf/JutsuPdfTemplate.js';

const bytes = await new BandPdfGenerator().generate(band, new JutsuPdfTemplate());
```

Este ejemplo pertenece a un módulo ejecutado por Vite. `band` es la instancia de los datos de la banda; no se necesita leer de nuevo los controles del formulario.

- `PdfTemplateLoader` carga una URL mediante `fetch`, comprueba la respuesta HTTP y devuelve un `PdfDocument`. La función de petición se puede sustituir en las pruebas.
- `PdfDocument` gestiona un documento de `pdf-lib`: carga sus bytes, identifica sus páginas, consulta sus dimensiones, prepara una fuente estándar y guarda el resultado en memoria. No conoce bandas, formularios ni configuraciones de campos.
- `src/pdf/fichas_rellenables.pdf` es la plantilla proporcionada, exportada desde Affinity. Tiene una página de 595,44 × 841,92 puntos. Se carga como documento existente, conservando el archivo original.
- `public/templates/test-template.pdf` es una plantilla auxiliar vectorial con una página A4 de 595,28 × 841,89 puntos y otra A5 de 419,53 × 595,28 puntos. Se mantiene para comprobar documentos con páginas de diferentes dimensiones y la inserción de texto de prueba.

Las dimensiones corresponden al `MediaBox` de cada página, expresado en puntos PDF. Los índices de página empiezan en cero. La carga mantiene los metadatos existentes y cada carga crea un documento independiente.

| Método | Responsabilidad |
| --- | --- |
| `PdfTemplateLoader.load(url)` | Obtener y cargar una plantilla existente. |
| `PdfDocument.fromBytes(bytes)` | Abrir un PDF desde `Uint8Array` o `ArrayBuffer`. |
| `getPageCount()` | Consultar el número de páginas. |
| `getPageInfo(index)` / `getPagesInfo()` | Obtener índices, anchos y altos. |
| `getPage(index)` | Acceder a una página de `pdf-lib` para preparar contenido. |
| `prepareForText()` | Incorporar Helvetica estándar una sola vez y devolver su fuente. |
| `save()` | Serializar el documento modificado como `Uint8Array`, sin descargarlo. |

`prepareForText()` conserva Helvetica para las pruebas independientes del módulo de documentos. La generación de fichas utiliza `PdfFontProvider` y Eagle Lake. La carga, páginas, guardado e incrustación de fuentes siguen la [API oficial de PDFDocument](https://pdf-lib.js.org/docs/api/classes/pdfdocument); las dimensiones se obtienen con [PDFPage.getSize](https://pdf-lib.js.org/docs/api/classes/pdfpage#getsize).

### Comprobación en el navegador durante el desarrollo

Inicia Vite con `npm run dev`, abre la aplicación y ejecuta este ejemplo en la consola del navegador. Es una prueba independiente del formulario y utiliza directamente la ruta del archivo proporcionado, servida por Vite durante el desarrollo.

```js
const { PdfTemplateLoader } = await import('/src/pdf/PdfTemplateLoader.js');
const testPdf = await new PdfTemplateLoader().load('/src/pdf/fichas_rellenables.pdf');
console.table(testPdf.getPagesInfo());

await testPdf.prepareForText();
const pdfBytes = await testPdf.save();
console.log(pdfBytes instanceof Uint8Array, pdfBytes.length);
```

El resultado queda en `pdfBytes` en memoria y la plantilla original se conserva. Este ejemplo comprueba solo el módulo de documentos. El botón de la interfaz ejecuta el generador completo. `JutsuPdfTemplate` utiliza URLs de recursos que Vite transforma para desarrollo y producción, sin depender de rutas `/src/` en la versión compilada.

## Desarrollo local

Requiere Node.js compatible con la versión de Vite instalada y npm. La versión de Node.js utilizada para verificar el proyecto es **22.22.1**.

```sh
npm install
npm run dev
```

Abre la URL local que indique Vite en la terminal (normalmente `http://localhost:5173`).

## Compilación de producción

```sh
npm run build
```

Los archivos estáticos se generan en `dist/`. Para comprobar esa compilación localmente:

```sh
npm run preview
```

El alojamiento y la ruta o subdominio definitivos se configurarán más adelante. Esta fase no publica la aplicación ni modifica Ghost.

## Estructura

```text
index.html          Página principal y estructura accesible
public/
  templates/
    test-template.pdf Plantilla de prueba de dos páginas (A4 y A5)
src/
  main.js           Crea Band y GameCatalog, y monta BandForm (ES Modules)
  data/
    ninja-options.js Opciones de tipos, grupos y estadísticas
    game-data.js    Reúne los catálogos de juego
    ninja-types.json Los cuatro tipos y sus estadísticas
    technique-groups.json Los doce grupos y sus 36 técnicas
    equipment.json Armas, objetos y sus costes en acciones
  models/
    Band.js         Banda de tres ninjas
    Ninja.js        Datos y composición de un ninja
    NinjaStats.js   Estadísticas de un ninja
    TechniqueGroup.js Selección de un grupo y sus tres técnicas
    Technique.js    Datos inmutables de una técnica
    Equipment.js    Listas de equipamiento y operaciones de añadir/eliminar
    EquipmentEntry.js Nombre, descripción y coste inmutables de un arma u objeto
    GameCatalog.js  Consulta de las definiciones disponibles
  pdf/
    PdfTemplateLoader.js Carga de plantillas PDF por URL
    PdfDocument.js  Páginas, recursos de texto y guardado en memoria
    BandPdfGenerator.js Coordinación de la generación desde los datos
    BandFieldResolver.js Lectura de las rutas de la banda
    PdfFieldFormatter.js Conversión de valores a texto
    PdfFontProvider.js Carga e incrustación de fuentes
    PdfFontFamily.js Selección de glifos y métricas de texto
    PdfTextLayout.js Ajuste de líneas y tamaños dentro de las cajas
    PdfFieldRenderer.js Escritura vectorial del texto sobre la página
    JutsuPdfTemplate.js URLs de la configuración, PDF y fuentes
    PdfTemplateConfig.js Validación y consulta de la configuración
    PdfTemplateConfigLoader.js Lectura del JSON y referencia a su URL
    AffinityCoordinateConverter.js Conversión de unidades y origen
    fichas_rellenables.pdf Plantilla proporcionada, de una página
    fichas_rellenables_coordenadas.json Configuración activa de los campos
    README.md       Guía de configuración y generación
  fonts/
    Eagle_Lake/     Fuente principal facilitada y licencia
    DejaVu_Sans/    Fuente de respaldo para símbolos
  ui/
    BandForm.js     Montaje del formulario y coordinación de los ninjas
    NinjaEditor.js  Composición del editor de un ninja
    StatsView.js    Visualización de estadísticas de solo lectura
    TechniqueGroupEditor.js Selector de grupo y composición de sus técnicas
    TechniqueView.js Visualización de una técnica de solo lectura
    EquipmentListEditor.js Edición de una lista de armas u objetos
    EquipmentEntryEditor.js Edición de una entrada de equipamiento
    FormField.js    Control etiquetado y conversión de su valor
    ReadOnlyField.js Presentación de un valor de solo lectura
    PdfGenerationController.js Estado del botón y PDF en memoria
    dom.js          Funciones pequeñas para crear nodos y fieldsets
  styles.css        Estilos y adaptación a móvil
tests/
  models.test.js    Pruebas de los modelos sin navegador
  catalog.test.js   Selección de datos reales, estadísticas y costes
  pdf.test.js       Carga, páginas, preparación, guardado y errores de PDF
  template-config.test.js Configuración, enlaces de campos y coordenadas
  pdf-generation.test.js Generación con los doce grupos, fuentes y datos
  fixtures/
    game-data.js    Datos sintéticos exclusivos para las pruebas
package.json        Configuración y comandos de Vite
package-lock.json   Versiones resueltas de las dependencias
.gitignore          Excluye dependencias y archivos de compilación
```

Las funciones de descarga e impresión se incorporarán cuando se autorice la fase 6.

## Criterio de arquitectura

El desarrollo sigue orientación a objetos, con una clase por archivo y una responsabilidad por clase. Los objetos se componen entre sí: una banda contiene ninjas; cada ninja contiene sus estadísticas, grupo de técnicas y equipamiento. La interfaz recibe esos objetos y delega cada sección a su editor. Se usa composición sin introducir una jerarquía de clases base.

- `models/` contiene el estado y las operaciones de los datos. `Ninja.selectType(definition)` asigna el tipo y sus estadísticas disponibles; `TechniqueGroup.selectGroup(definition)` asigna tres técnicas. `Equipment` gestiona las plazas, sus límites y la selección con `addEntry(kind)`, `selectEntry(kind, index, definition)` y `removeEntry(kind, index)`. Las clases funcionan sin navegador.
- `ui/` contiene la edición y presentación. `EquipmentListEditor` invoca las operaciones de `Equipment`; `EquipmentEntryEditor` muestra el desplegable y la descripción de una entrada. `StatsView` y `TechniqueView` muestran datos derivados sin controles editables.
- `FormField` gestiona controles editables y `ReadOnlyField` presenta pares de etiqueta y valor sin permitir su edición.
- `data/ninja-options.js` reúne los nombres conocidos. Los archivos JSON contienen los catálogos. `data/game-data.js` los reúne para consultarlos mediante `GameCatalog`.
- `main.js` únicamente crea y conecta los objetos de la aplicación.
- `pdf/` trabaja con documentos y plantillas, de forma independiente de los modelos del juego y de la interfaz. La obtención de la plantilla y la gestión del documento pertenecen a clases diferentes.
- `BandFieldResolver` lee las rutas del modelo y `PdfFieldFormatter` da formato a sus valores. `PdfFontProvider` obtiene las fuentes; `PdfFontFamily` resuelve los glifos y sus métricas. `PdfTextLayout` calcula líneas y posiciones; `PdfFieldRenderer` escribe el texto. `BandPdfGenerator` coordina esas tareas.
- `PdfGenerationController` conecta el botón con el generador y conserva el último PDF válido. El estado de la interfaz no pertenece a los modelos ni al generador.

Los perfiles se mantienen en `ninja-types.json`, las técnicas en `technique-groups.json`, y las armas y objetos en `equipment.json`. Para modificar cómo se muestran, se cambia su vista o editor. Los límites se cambian en `Equipment.getLimit(kind)`. Los cambios posteriores deben conservar esta separación.

Las instancias conservan la estructura de datos anterior y pueden convertirse a datos JSON con `JSON.stringify(band)`.

## Pruebas

```sh
npm test
```

Las pruebas usan el ejecutor integrado de Node.js, sin añadir librerías de pruebas. Verifican perfiles derivados, técnicas inmutables, cambios de selección, límites de equipamiento, independencia de datos y estructura JSON. Las pruebas PDF cargan tanto la plantilla proporcionada como la auxiliar, comprueban las dimensiones por página, preparan texto, guardan y reabren los bytes, y cubren errores HTTP y archivos inválidos. Las funciones de archivos de Node se usan únicamente en las pruebas; el módulo de la aplicación utiliza `fetch` y `pdf-lib`.

Los valores sintéticos de `tests/fixtures/` no son reglas de Jutsu ni se importan desde la aplicación. La compilación se comprueba con `npm run build`.

Las pruebas de configuración comprueban las rutas de los 69 campos contra el modelo, la detección de datos pendientes, los estilos por campo y la resolución relativa del PDF. Las conversiones cubren referencias en píxeles y puntos, escalas por eje, orígenes PDF distintos de cero, inversión del eje Y y el rechazo de cajas inválidas.

Las pruebas de generación utilizan los doce grupos reales de técnicas, costes variables, símbolos Unicode, inventarios combinados y una copia de los datos tomada antes de las peticiones. Comprueban que la banda y la plantilla original se conservan. Si un texto no cabe al tamaño mínimo configurado, se informa del campo afectado en lugar de recortarlo silenciosamente.
