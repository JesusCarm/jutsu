# Jutsu Band Builder

Aplicación local de Gipsy Games para crear una banda de **tres ninjas** y generar sus fichas. Migrada de JavaScript/Vite a Angular e implementada hasta la **fase 6**: generación, descarga con el nombre de la banda y apertura del PDF para imprimir. Todo funciona en el navegador.

## Entorno y dependencias

- Node.js `^20.19.0`, `^22.12.0` o `>=24.0.0`; migración verificada con **22.22.1** y npm **9.2.0**.
- Angular **21.2.26**, CLI y compilador de aplicación `@angular/build` **21.2.30**.
- Angular Material y CDK **21.2.14**, tema Material 3 con colores personalizables en `src/styles.scss`.
- TypeScript **5.9.3**, modo estricto y plantillas estrictas.
- Vitest **4.0.18** y jsdom **28.0.0** mediante el ejecutor oficial de Angular CLI.
- `pdf-lib` **1.17.1** y `@pdf-lib/fontkit` **1.1.1**, conservadas.

Angular 21.2 es la última serie estable compatible con el Node instalado. Angular 22.3 exige Node `^22.22.3 || ^24.15.0 || >=26.0.0`; no se ha actualizado el entorno del sistema para forzar ese salto. Los parches de Angular, CLI y Material se publican por separado, por eso sus números no coinciden. El lockfile fija las versiones instaladas.

Referencias: [compatibilidad de Angular](https://angular.dev/reference/versions), [guía de estilo](https://angular.dev/style-guide), [Signals](https://angular.dev/guide/signals), [zoneless](https://angular.dev/guide/zoneless), [Angular Material](https://material.angular.dev/).

## Instalación y desarrollo

```bash
npm ci
npm run dev
```

Abre `http://localhost:4200`. `npm start` es equivalente. El servidor de desarrollo usa Vite integrado en Angular CLI; la compilación utiliza el builder oficial `@angular/build:application`, basado en esbuild. No hay configuración propia de Vite.

## Compilación de producción

```bash
npm run build
```

Salida estática: **`dist/jutsu/browser/`**. Publica su contenido en un alojamiento estático con redirección de rutas a `index.html`. Para una subcarpeta, por ejemplo `/jutsu/`:

```bash
npm run build -- --base-href /jutsu/
```

`npm run preview` sirve una compilación de producción mediante Angular CLI. No se ha publicado la aplicación ni configurado un servidor de aplicaciones.

## Pruebas

```bash
npm test
npm run typecheck
```

`npm run test:watch` mantiene las pruebas en observación. `ng test` usa Vitest a través del ejecutor oficial, sin configuración personalizada. Las pruebas originales JavaScript se conservan, adaptadas a Vitest y a las nuevas rutas; sus casos inválidos siguen comprobando las validaciones en tiempo de ejecución. Todo el código de la aplicación está en TypeScript estricto.

Las pruebas cubren catálogo, modelos, límites de equipo, aislamiento entre ninjas, selecciones y limpieza de valores, foco de teclado, navegación, generación asíncrona, errores, descarte de resultados obsoletos, fuentes, Unicode, coordenadas y composición PDF. También verifican nombres de archivo, selección de plantilla, botones de exportación, descarga mediante Blob, ventanas bloqueadas y limpieza de URLs. El editor comprueba la sincronización de minifichas, estadísticas e iconos, los huecos de equipo seleccionados fuera de orden y el cambio de personaje sin recrear formularios ni invalidar el PDF. Las pruebas AcroForm reabren cada ficha, verifican sus quince valores y apariencias, limpian datos anteriores y comprueban los doce grupos de técnicas. La exportación estática verifica tres fichas vectoriales independientes en A4, sin bordes de formulario ni notas, con costes separados e iconos Mokushin condicionales. Una captura de referencia conserva la equivalencia del motor de coordenadas original sobre un lienzo de sus dimensiones originales.

## Arquitectura

```text
src/
  app/
    core/
      models/               # Modelo de banda y reglas existentes, sin Angular
      services/             # Catálogo JSON y acceso a URLs de plataforma
    features/
      character-sheet/      # Editor, estado Signals y componentes en subcarpetas
      pdf-generator/        # Motor PDF, plantillas, generación y exportación local
    layout/                 # Estructura base y pie de la aplicación
    shared/                 # Iconos SVG y recursos locales tipados
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts
    app.routes.ts
  assets/
    data/                   # Catálogos JSON originales
    fonts/                  # Eagle Lake, DejaVu Sans y licencias
    icons/                  # SVG _ico de estadísticas, equipo y Mokushin
    pdf/                    # Formulario PDF y coordenadas del motor anterior
  index.html
  main.ts
  styles.scss
public/
  licenses/
  templates/test-template.pdf
tests/                     # Pruebas originales y referencia de equivalencia
docs/migration/             # Inventario, decisiones e informe de verificación
```

Los componentes son standalone, usan `OnPush`, `inject()`, entradas/salidas con Signals y control de flujo `@for`. No hay NgModules propios. Angular 21 funciona **sin Zone.js** por defecto; no se instala ni se carga.

Los 15 componentes tienen una carpeta propia, clases terminadas en `Component` y sus archivos separados. Por ejemplo:

```text
features/character-sheet/ninja-editor/
  ninja-editor.component.ts
  ninja-editor.component.html
  ninja-editor.component.scss
```

Los servicios inyectables usan archivos `.service.ts` y clases terminadas en `Service`; las pruebas conservan el sufijo correspondiente, como `.component.spec.ts` o `.service.spec.ts`. Las plantillas se cargan con `templateUrl` y los estilos con `styleUrl`. Los estilos de cada componente viven en su SCSS; `src/styles.scss` contiene el tema, los controles compartidos y las utilidades globales. Las clases independientes del dominio y del motor PDF conservan sus nombres TypeScript.

Las convenciones quedan registradas en [AGENTS.md](AGENTS.md) y en los schematics de `angular.json`: componentes en carpetas, HTML/SCSS externos y sufijos `.component`, `.service`, `.directive`, `.pipe`, `.guard`, `.resolver`, `.interceptor` y `.module`. Las aplicaciones nuevas usan la nomenclatura `fileNameStyleGuide: "2016"`. Se han comprobado esos ocho generadores y el generador de aplicaciones con `--dry-run`.

`BandStateService` conserva las reglas de los modelos y publica instantáneas tipadas mediante Signals de solo lectura y `computed()`. Los controles editables usan **Reactive Forms tipados**: Signal Forms de Angular 21 todavía declara su API como experimental, por lo que no cumple el requisito de estabilidad de esta migración. No se usan formularios template-driven ni RxJS para el estado síncrono. Los controles mantienen su instancia de `FormControl` y sincronizan los cambios externos mediante `effect()`, conservando el foco y el cursor al editar.

Solo existe una pantalla real. Angular Router la carga de forma diferida y redirige rutas desconocidas al editor. No se añaden pantallas ficticias ni carpetas para funciones futuras. El motor PDF y sus dependencias se cargan al generar por primera vez; no se añade `@defer` a un formulario que debe estar disponible inmediatamente.

La presentación sigue las referencias del editor oscuro: cabecera compacta, barra de escuadra y tres minifichas. Los controles tienen etiquetas en español; los nombres y reglas de los catálogos conservan sus valores originales en inglés para los datos y el PDF. Los campos y selectores son controles HTML nativos con Reactive Forms y estilos propios sobre el tema base de Material.

En pantallas inferiores a **56 rem**, las tres minifichas aparecen arriba y solo se muestra debajo el formulario del personaje seleccionado. A partir de ese ancho se muestran tres columnas, cada una con su minificha y formulario; las minifichas pasan a ser informativas, sin selección por clic ni botones de selección en el recorrido de teclado. Se conserva una sola instancia de cada editor: cambiar de personaje o de tamaño de pantalla no borra las selecciones. La selección móvil es estado de interfaz y no invalida el PDF generado.

`NinjaSummaryComponent`, `StatsViewComponent` y `EquipmentSummaryComponent` presentan el resumen sin modificar el modelo. `EquipmentPresentation` comparte el mapa de iconos y los huecos entre minifichas y selectores. `UiIconComponent`, en `shared/ui-icon/ui-icon.component.ts`, centraliza los SVG con sufijo `_ico` aportados en `src/assets/icons/` y los dibujos provisionales de los iconos que aún no tienen un recurso equivalente. Se utilizan SVG para las seis estadísticas, incluida vida, las categorías de armas y objetos y Mokushin. `mokushin_ico.svg` se comparte con el generador PDF. `objetivo_ico.svg` está registrado como `target`, disponible para su asignación cuando se defina su uso. Las URLs respetan el `<base href>` y los iconos se muestran a **20 × 20 px**, sin recorte circular. Los SVG negros se presentan en claro mediante CSS para contrastar con el fondo oscuro. Para sustituir otro icono basta con registrar su archivo en ese componente; no es necesario modificar catálogos ni reglas. Las seis estadísticas incluyen movimiento y siguen siendo de solo lectura. Los detalles de armas y objetos se consultan mediante el desplegable «Ver efectos del equipo».

## Funciones actuales

- Nombre opcional de la banda para identificar el archivo descargado.
- Tres ninjas independientes con nombre y uno de cuatro tipos.
- Estadísticas derivadas de tipo, no editables, incluyendo valores cero.
- Doce grupos de tres técnicas, descripción, coste de chakra fijo o variable e icono Mokushin en el editor y junto al coste en el PDF.
- Tres huecos de armas y dos de objetos por ninja, con datos derivados del catálogo. «Sin arma» y «Sin objeto» vacían un hueco sin desplazar los demás.
- Minifichas con iconos de las seis estadísticas y del equipo, sincronizadas con su personaje.
- Generación de PDF desde una instantánea de la banda, estados de carga, éxito y error, e invalidación al editar.
- Plantilla de un ninja con quince campos por nombre y tres notas que marcan Mokushin; generación de tres fichas independientes en una página A4, sin cajas de formulario ni resaltados de edición.
- Eagle Lake y respaldo DejaVu Sans, fuentes locales incrustadas y ajuste del texto a cada campo. El motor de coordenadas anterior sigue disponible para otras plantillas.
- Selector con la plantilla actual de tres ninjas por página; solo se ofrecen plantillas disponibles.
- Descarga del PDF y apertura en otra pestaña para imprimir desde el visor del navegador.

No se han añadido campos obligatorios ni restricciones al nombre que no existían. El modelo sigue rechazando tipos y grupos desconocidos, índices inválidos, datos mal formados y exceso de equipo.

## PDF y funcionamiento local

El motor de `features/pdf-generator/` no depende de Angular ni del DOM. Recibe datos, plantilla y una función de carga de recursos sustituible en pruebas. La plantilla actual contiene una ficha con campos `Ninja1_…`; `JutsuFormFields` relaciona sus nombres con los datos y estilos. Cada ninja rellena una copia independiente, que se aplana antes de componer las tres en una página A4. Las posiciones se toman del PDF, sin cargar el JSON de coordenadas. Cada técnica incluye nombre y descripción; el chakra va en su campo `_cost`. Las notas cuyo contenido es `Ninja1_technique_1_mokushin`, y sus equivalentes para las técnicas 2 y 3, marcan las cajas donde se dibuja el SVG si corresponde. Se admiten diferencias de mayúsculas. Las notas se retiran del resultado y el inventario combina armas y objetos. La exportación conserva el diseño y la nitidez mediante aplanado vectorial. El PDF descargado ya no tiene campos editables; la plantilla original permanece rellenable y no se modifica.

`PdfGenerationService` lo conecta con el formulario y conserva los bytes válidos en memoria. `getPdfBytes()` devuelve una copia o `null` si cambió la banda o la plantilla. [Documentación del motor y exportación](src/app/features/pdf-generator/README.md).

1. Introduce el nombre de **Escuadra** si quieres personalizar el nombre del archivo y completa los ninjas. En móvil, toca su minificha para elegir el personaje que quieres editar.
2. Elige **Plantilla de ficha**. Por ahora contiene únicamente la plantilla original con Eagle Lake.
3. Pulsa **Generar y descargar PDF**, en la barra de iconos o al pie del editor. Al terminar se inicia automáticamente la descarga y aparecen el nombre del archivo y los botones de exportación habilitados. Por ejemplo, `Los Cuervos` produce `jutsu-squad-Los-Cuervos.pdf`; si no hay nombre se usa `jutsu-squad.pdf`. Los caracteres incompatibles con nombres de archivo se sustituyen y los nombres largos se limitan.
4. El icono **Descargar PDF** permite descargar de nuevo el documento generado, también si el navegador no inició la descarga automática.
5. El icono **Abrir PDF para imprimir** abre el mismo documento en otra pestaña. Utiliza los controles de impresión del visor PDF. Si el navegador bloquea la pestaña, el estado indica que debes permitir ventanas emergentes para este sitio y reintentar. Los iconos tienen etiquetas accesibles y muestran su acción al pasar el puntero.

Cualquier edición, incluido el nombre de la banda, o cambio de plantilla deshabilita las exportaciones hasta volver a generar. Una generación en curso que quede obsoleta se descarta. Los PDF ya abiertos conservan su recurso hasta cerrar su pestaña; las URLs temporales de descarga se liberan después de iniciarla y todos los recursos se limpian al destruir la aplicación.

Plantilla, coordenadas, fuentes y catálogos se copian como recursos de la aplicación. `PlatformAssetsService` concentra la resolución respecto al `<base href>`, compatible con navegación estática y futuras adaptaciones de plataforma. No hay backend, autenticación, APIs remotas, IA en ejecución ni almacenamiento cloud. La versión anterior no persistía la banda: se sigue perdiendo al recargar; no se migra ni se introduce almacenamiento.

La incorporación posterior de PWA o Capacitor podrá reutilizar el motor y adaptar el acceso a plataforma. **No se instalan Capacitor, Service Worker ni caché offline en esta fase.**

## Revisión de la migración

Consulta [el informe de migración](docs/migration/angular-migration.md) para el inventario y las verificaciones de aquella fase. [El README anterior](docs/migration/phase-5-history.md) se conserva como documento histórico. La migración ya está integrada en `main` del repositorio [JesusCarm/jutsu](https://github.com/JesusCarm/jutsu).

El `.gitignore` excluye dependencias, compilaciones, cachés, cobertura, salidas generadas, copias de revisión y configuración local. Las plantillas PDF, fuentes, licencias, catálogos y `package-lock.json` forman parte del código versionado. La copia inicial `output/migration/vite-phase5-source.tar.gz` y el PDF de revisión permanecen únicamente en el entorno local.

Verificación actual: 91 pruebas automatizadas, comprobación de tipos y compilación de producción correctas. Se han renderizado y revisado las hojas de tres fichas de los doce grupos de técnicas, incluidos los símbolos Unicode. Las pruebas verifican los costes, los marcadores de nota, su limpieza, los iconos condicionales, la composición A4, el aislamiento de los ninjas y los errores de recursos. Los diez SVG `_ico` se copian a producción idénticos a los originales. El usuario confirmó la descarga de la fase 6 en Firefox desde `http://localhost:4200/`, tras resolver un error de `start` que mantenía una compilación anterior. Se ha comprobado por HTTP que el servidor entrega el nuevo editor con minifichas y las acciones de exportación. La revisión visual del editor en escritorio y móvil, y la apertura manual para imprimir, siguen pendientes: el host de acceso al navegador no estaba disponible en la sesión de implementación.
