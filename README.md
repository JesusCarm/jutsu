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

Las pruebas cubren catálogo, modelos, límites de equipo, aislamiento entre ninjas, selecciones y limpieza de valores, foco de teclado, navegación, generación asíncrona, errores, descarte de resultados obsoletos, fuentes, Unicode, coordenadas y composición PDF. También verifican nombres de archivo, selección de plantilla, botones de exportación, descarga mediante Blob, ventanas bloqueadas y limpieza de URLs. Una captura de referencia del motor original comprueba texto, cajas, estilos, saltos de línea, tamaños y líneas base para los doce grupos de técnicas.

## Arquitectura

```text
src/
  app/
    core/
      models/               # Modelo de banda y reglas existentes, sin Angular
      services/             # Catálogo JSON y acceso a URLs de plataforma
    features/
      character-sheet/      # Editor, estado Signals y controles Material
      pdf-generator/        # Motor PDF, plantillas, generación y exportación local
    layout/                 # Cabecera, contenido y pie originales
    app.ts
    app.config.ts
    app.routes.ts
  assets/
    data/                   # Catálogos JSON originales
    fonts/                  # Eagle Lake, DejaVu Sans y licencias
    pdf/                    # Plantilla original y coordenadas exactas
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

`BandState` conserva las reglas de los modelos y publica instantáneas tipadas mediante Signals de solo lectura y `computed()`. Los controles editables usan **Reactive Forms tipados**: Signal Forms de Angular 21 todavía declara su API como experimental, por lo que no cumple el requisito de estabilidad de esta migración. No se usan formularios template-driven ni RxJS para el estado síncrono. `linkedSignal()` mantiene el valor de los controles cuando cambia su entrada.

Solo existe una pantalla real. Angular Router la carga de forma diferida y redirige rutas desconocidas al editor. No se añaden pantallas ficticias ni carpetas para funciones futuras. El motor PDF y sus dependencias se cargan al generar por primera vez; no se añade `@defer` a un formulario que debe estar disponible inmediatamente.

La presentación conserva el contenido en inglés y la distribución del editor existente. Material proporciona campos, selectores nativos accesibles y botones; CDK mantiene el foco tras editar listas. El tema sigue la preferencia clara u oscura del dispositivo y el SCSS parte de una columna para móvil, ampliándose a dos en pantallas mayores. No se introduce un cambio completo de diseño.

## Funciones actuales

- Nombre opcional de la banda para identificar el archivo descargado.
- Tres ninjas independientes con nombre y uno de cuatro tipos.
- Estadísticas derivadas de tipo, no editables, incluyendo valores cero.
- Doce grupos de tres técnicas, descripción, coste de chakra fijo o variable e indicación Mokushin.
- Hasta tres armas y dos objetos por ninja; altas, bajas, selección y limpieza con datos derivados del catálogo.
- Generación de PDF desde una instantánea de la banda, estados de carga, éxito y error, e invalidación al editar.
- PDF original, 69 campos declarados y 54 activos; 15 campos sin coordenadas siguen desactivados.
- Eagle Lake y respaldo DejaVu Sans, incrustación local de fuentes, precisión de coordenadas y algoritmos originales.
- Selector con la plantilla actual de tres ninjas por página; solo se ofrecen plantillas disponibles.
- Descarga del PDF y apertura en otra pestaña para imprimir desde el visor del navegador.

No se han añadido campos obligatorios ni restricciones al nombre que no existían. El modelo sigue rechazando tipos y grupos desconocidos, índices inválidos, datos mal formados y exceso de equipo.

## PDF y funcionamiento local

El motor de `features/pdf-generator/` no depende de Angular ni del DOM. Recibe datos, plantilla y una función de carga de recursos sustituible en pruebas. `PdfGeneration` lo conecta con el formulario y conserva los bytes válidos en memoria. `getPdfBytes()` devuelve una copia o `null` si cambió la banda o la plantilla. [Documentación del motor y exportación](src/app/features/pdf-generator/README.md).

1. Introduce **Squad name** si quieres personalizar el nombre del archivo y completa los ninjas.
2. Elige **Sheet template**. Por ahora contiene únicamente la plantilla original con Eagle Lake.
3. Pulsa **Generate PDF**. Al terminar se inicia automáticamente la descarga y aparecen el nombre del archivo y los botones de exportación habilitados. Por ejemplo, `Los Cuervos` produce `Los-Cuervos.pdf`; si no hay nombre se usa `jutsu-squad.pdf`. Los caracteres incompatibles con nombres de archivo se sustituyen y los nombres largos se limitan.
4. **Download PDF** permite descargar de nuevo el documento generado, también si el navegador no inició la descarga automática.
5. **Open PDF to print** abre el mismo documento en otra pestaña. Utiliza los controles de impresión del visor PDF. Si el navegador bloquea la pestaña, el estado indica que debes permitir ventanas emergentes para este sitio y reintentar.

Cualquier edición, incluido el nombre de la banda, o cambio de plantilla deshabilita las exportaciones hasta volver a generar. Una generación en curso que quede obsoleta se descarta. Los PDF ya abiertos conservan su recurso hasta cerrar su pestaña; las URLs temporales de descarga se liberan después de iniciarla y todos los recursos se limpian al destruir la aplicación.

Plantilla, coordenadas, fuentes y catálogos se copian como recursos de la aplicación. `PlatformAssets` concentra la resolución respecto al `<base href>`, compatible con navegación estática y futuras adaptaciones de plataforma. No hay backend, autenticación, APIs remotas, IA en ejecución ni almacenamiento cloud. La versión anterior no persistía la banda: se sigue perdiendo al recargar; no se migra ni se introduce almacenamiento.

La incorporación posterior de PWA o Capacitor podrá reutilizar el motor y adaptar el acceso a plataforma. **No se instalan Capacitor, Service Worker ni caché offline en esta fase.**

## Revisión de la migración

Consulta [el informe de migración](docs/migration/angular-migration.md) para el inventario y las verificaciones de aquella fase. [El README anterior](docs/migration/phase-5-history.md) se conserva como documento histórico. La migración ya está integrada en `main` del repositorio [JesusCarm/jutsu](https://github.com/JesusCarm/jutsu).

El `.gitignore` excluye dependencias, compilaciones, cachés, cobertura, salidas generadas, copias de revisión y configuración local. Las plantillas PDF, fuentes, licencias, catálogos y `package-lock.json` forman parte del código versionado. La copia inicial `output/migration/vite-phase5-source.tar.gz` y el PDF de revisión permanecen únicamente en el entorno local.

Verificación de la fase 6: 73 pruebas automatizadas, comprobación de tipos y compilación de producción correctas. La revisión manual de descarga, pestaña PDF e impresión queda pendiente porque el host de acceso al navegador no estaba disponible en la sesión de implementación.
