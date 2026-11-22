# Migración a Angular — fase 5

Fecha: 22 de noviembre de 2026. Rama de trabajo: `migration/angular-modern`.

## Inventario anterior a los cambios

La aplicación era JavaScript ES Modules con Vite 8.3.8 y sin TypeScript ni Angular. Tenía una única pantalla creada mediante manipulación del DOM. `Band`, `Ninja`, `NinjaStats`, `TechniqueGroup`, `Technique`, `Equipment`, `EquipmentEntry` y `GameCatalog` concentraban las reglas. Tres JSON proporcionaban cuatro tipos, doce grupos de tres técnicas, tres armas y cuatro objetos.

El formulario permitía editar nombres, elegir tipos y grupos, consultar atributos derivados y añadir/quitar hasta tres armas y dos objetos por ninja. Conservaba el foco al editar listas. No había campos obligatorios, navegación entre varias pantallas, persistencia ni backend.

El flujo PDF de la fase 5 tomaba una instantánea JSON, cargaba la plantilla y sus coordenadas, componía el texto con Eagle Lake y DejaVu Sans y conservaba un `Uint8Array` en memoria. Descartaba resultados si la banda cambiaba durante la generación. La descarga, impresión y selección de plantillas estaban expresamente pendientes de la fase 6.

Se identificaron la plantilla original, su JSON de coordenadas de 69 campos (54 activos y 15 desactivados), dos fuentes locales, licencias y una plantilla auxiliar de dos páginas. Las pruebas originales cubrían 40 casos de modelos, catálogo, PDF y coordenadas. Pasaron antes de editar. El repositorio tenía archivos preparados en el índice y archivos sin seguimiento, pero **ningún commit**.

## Decisiones y estructura resultante

- Base generada con Angular CLI oficial 21.2.30, standalone, routing, SCSS y modo estricto. Se integró la configuración en el repositorio existente.
- Angular 21.2.26 es compatible con el Node 22.22.1 instalado. Angular 22.3.0, estable consultada, exige como mínimo Node 22.22.3 en esa serie. Material/CDK usan su último parche compatible de la serie 21, 21.2.14.
- Builder oficial `@angular/build:application` con esbuild; Vite gestionado por CLI para desarrollo. Sin SSR, prerender, AnalogJS o configuración Vite propia.
- Componentes standalone `OnPush`, `inject()`, `input()`, `output()` y `@for`; `linkedSignal()` sincroniza controles editables con sus entradas. No se necesitan enlaces bidireccionales de componentes con `model()` ni bloques `@defer` adicionales.
- `core/models/` conserva las clases y las reglas, ahora tipadas. `core/services/` contiene el catálogo y la resolución de URLs locales.
- `features/character-sheet/` contiene `BandState`, el editor y componentes pequeños de identidad, estadísticas, técnicas y equipo. El estado es Signals con vistas derivadas `computed()`.
- `features/pdf-generator/` contiene el motor puro, sus tipos, el servicio de coordinación y la acción visual. Las dependencias PDF se cargan al pulsar generar.
- `layout/` conserva cabecera y pie. El router carga la única pantalla real de forma diferida y redirige rutas desconocidas al editor.
- `src/assets/` reúne catálogos, PDF, coordenadas y fuentes originales. La plantilla auxiliar y las licencias públicas se mantienen.
- Material 3 proporciona tema configurable y colores claros/oscuros según el dispositivo. Los selectores nativos dentro de campos Material mantienen interacción táctil y accesibilidad. CDK restaura el foco tras altas y bajas. Las reglas SCSS comienzan con una columna y se amplían a partir de 40 rem.
- Sin Zone.js, siguiendo el comportamiento por defecto de Angular 21.
- **Reactive Forms tipados**: `@angular/forms/signals` de la versión instalada declara su API como experimental (`@experimental 21.0.0` en sus declaraciones). Se prioriza la estabilidad solicitada; no se introducen formularios template-driven. RxJS solo permanece como dependencia requerida por Angular y Material.

Referencias oficiales: [versiones](https://angular.dev/reference/versions), [Signal Forms v21](https://v21.angular.dev/api/forms/signals/form), [zoneless](https://angular.dev/guide/zoneless), [estilo](https://angular.dev/style-guide).

## Preservación del comportamiento y recursos

Se conservan los algoritmos de conversión de coordenadas, ajuste de texto, separación de líneas, métricas, elección de glifos, formateo y composición. Los cambios del motor son tipos TypeScript, nombres/rutas de módulos y resolución de recursos. La normalización de entradas en las pruebas convierte los Buffer de Node a Uint8Array para evitar diferencias de contexto con jsdom; no cambia el algoritmo de producción.

Se ha comprobado igualdad byte a byte entre los archivos iniciales y los recursos trasladados: tres catálogos, plantilla, coordenadas, fuentes, licencias y PDF auxiliar. No se han redondeado coordenadas ni activado campos pendientes.

`tests/fixtures/phase5-render-operations.json` se capturó del motor original antes de retirarlo. La prueba de equivalencia compara las 216 operaciones de cuatro bandas que cubren los doce grupos: texto, cajas, estilos, tamaños de letra, saltos de línea y posiciones finales. Esa referencia no se regenera automáticamente al ejecutar tests.

El PDF de revisión está en `output/pdf/angular-migration-preview.pdf`. Se renderizó con Poppler a 1500 píxeles y se inspeccionó visualmente. La imagen es idéntica píxel a píxel a la generada antes de migrar: SHA-256 `9903355f1ef79fdd3df8d750735234fedc3d9d4242a9fd81f2477cecb5b66afc` en ambas imágenes.

Se conserva el README anterior en `phase-5-history.md` y una copia completa de las fuentes iniciales en `output/migration/vite-phase5-source.tar.gz`, sin node_modules, dist o metadatos Git. Al cerrar la migración se mantuvo el índice Git previo y no se crearon commits ni se realizó merge.

Para la posterior subida autorizada a `JesusCarm/jutsu`, se conserva el commit inicial remoto como base de `migration/angular-modern`. Se prepara un commit con la aplicación Angular y el `.gitignore` actualizado. Las salidas de revisión y la copia de las fuentes iniciales se excluyen del repositorio y permanecen locales. Las plantillas PDF y fuentes necesarias para ejecutar la aplicación sí se versionan. Se conserva además una copia del índice anterior a la publicación fuera del repositorio.

## Comprobaciones

| Comprobación | Resultado |
| --- | --- |
| Instalación desde lockfile (`npm ci`) | Correcta con npm 9.2.0 desde el lockfile, tras resolver las versiones de pruebas. |
| Producción (`npm run build`) | Correcta; salida estática en `dist/jutsu/browser/`. |
| TypeScript (`npm run typecheck`) | Correcto; modo estricto. La compilación también comprueba plantillas Angular. |
| Pruebas (`npm test`) | 49 casos en 10 archivos, todos correctos. |
| Servidor y recursos | `ng serve` arranca correctamente; HTTP 200 para la página y los siete recursos PDF/catálogos/fuentes, idénticos a sus fuentes y a la salida de producción. |
| Navegación | Carga diferida del editor y redirección de rutas desconocidas comprobadas con RouterTestingHarness. |
| Formularios | Interacciones DOM con TestBed/jsdom: tres ninjas, nombre, selecciones, limpieza, datos derivados, equipo y foco. |
| Generación PDF | Plantillas reales, doce grupos, Unicode, fuentes, documento reabierto, equivalencia con el motor inicial y descarte de resultados obsoletos. |
| Descarga | No existía en la fase 5; permanece pendiente y no se implementa. |
| Interfaz visual y móvil en navegador | Pendiente: el host de acceso al navegador no estaba disponible. |

La instalación inicial detectó un fallo interno de npm (`edgesOut`) al resolver versiones opcionales con rangos abiertos de Vitest. Se fijó Vitest 4.0.18 y jsdom 28.0.0; la instalación con npm 9.2.0 se completó correctamente, sin forzar peers ni usar `--legacy-peer-deps`.

## Revisión manual pendiente

1. Ejecutar `npm run dev` y revisar la pantalla en escritorio, tablet y móvil, incluido un ancho de 320 píxeles.
2. Comprobar los temas claro y oscuro con las preferencias del dispositivo y el contraste de campos, botones y valores de solo lectura.
3. Revisar selectores táctiles, navegación por teclado, foco tras altas/bajas y lectura de los estados de generación.
4. Abrir el PDF de revisión y confirmar el resultado en el visor e impresora habituales. La aplicación sigue sin botones de descarga o impresión.
5. Aprobar esta migración antes de iniciar cualquier función de la fase 6.

## Límites deliberados

No se añaden funciones de partida, descarga, impresión, persistencia, IndexedDB, autenticación, backend, IA, Capacitor, Service Worker ni caché PWA. Las futuras integraciones podrán reutilizar el motor PDF y adaptar `PlatformAssets`; la arquitectura no depende de un servicio remoto. Se mantiene la pérdida de la banda al recargar, igual que en la aplicación anterior.
