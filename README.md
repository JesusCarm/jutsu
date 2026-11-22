# Jutsu Band Builder

Aplicación local de Gipsy Games para crear una banda de **tres ninjas** y generar sus fichas. Migrada de JavaScript/Vite a Angular, conservando el alcance de la **fase 5**. El PDF se genera en memoria; descarga, impresión y selector de plantillas siguen pendientes de autorización para la fase 6.

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

Las pruebas cubren catálogo, modelos, límites de equipo, aislamiento entre ninjas, selecciones y limpieza de valores, foco de teclado, navegación, generación asíncrona, errores, descarte de resultados obsoletos, fuentes, Unicode, coordenadas y composición PDF. Una captura de referencia del motor original comprueba texto, cajas, estilos, saltos de línea, tamaños y líneas base para los doce grupos de técnicas.

## Arquitectura

```text
src/
  app/
    core/
      models/               # Modelo de banda y reglas existentes, sin Angular
      services/             # Catálogo JSON y acceso a URLs de plataforma
    features/
      character-sheet/      # Editor, estado Signals y controles Material
      pdf-generator/        # Motor PDF independiente, estado y acción de generar
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

## Funciones conservadas

- Tres ninjas independientes con nombre y uno de cuatro tipos.
- Estadísticas derivadas de tipo, no editables, incluyendo valores cero.
- Doce grupos de tres técnicas, descripción, coste de chakra fijo o variable e indicación Mokushin.
- Hasta tres armas y dos objetos por ninja; altas, bajas, selección y limpieza con datos derivados del catálogo.
- Generación de PDF desde una instantánea de la banda, estados de carga, éxito y error, e invalidación al editar.
- PDF original, 69 campos declarados y 54 activos; 15 campos sin coordenadas siguen desactivados.
- Eagle Lake y respaldo DejaVu Sans, incrustación local de fuentes, precisión de coordenadas y algoritmos originales.

No se han añadido campos obligatorios ni restricciones al nombre que no existían. El modelo sigue rechazando tipos y grupos desconocidos, índices inválidos, datos mal formados y exceso de equipo.

## PDF y funcionamiento local

El motor de `features/pdf-generator/` no depende de Angular ni del DOM. Recibe datos, plantilla y una función de carga de recursos sustituible en pruebas. `PdfGeneration` lo conecta con el formulario y conserva los bytes válidos en memoria. `getPdfBytes()` devuelve una copia o `null` si la banda cambió. [Documentación del motor](src/app/features/pdf-generator/README.md).

Plantilla, coordenadas, fuentes y catálogos se copian como recursos de la aplicación. `PlatformAssets` concentra la resolución respecto al `<base href>`, compatible con navegación estática y futuras adaptaciones de plataforma. No hay backend, autenticación, APIs remotas, IA en ejecución ni almacenamiento cloud. La versión anterior no persistía la banda: se sigue perdiendo al recargar; no se migra ni se introduce almacenamiento.

La incorporación posterior de PWA o Capacitor podrá reutilizar el motor y adaptar el acceso a plataforma. **No se instalan Capacitor, Service Worker ni caché offline en esta fase.**

## Revisión de la migración

Consulta [el informe de migración](docs/migration/angular-migration.md) para el inventario, las verificaciones y las limitaciones. [El README anterior](docs/migration/phase-5-history.md) se conserva como documento histórico. La rama `migration/angular-modern` se prepara para su publicación en [JesusCarm/jutsu](https://github.com/JesusCarm/jutsu), conservando el commit inicial del repositorio remoto como base y sin hacer merge en `main`.

El `.gitignore` excluye dependencias, compilaciones, cachés, cobertura, salidas generadas, copias de revisión y configuración local. Las plantillas PDF, fuentes, licencias, catálogos y `package-lock.json` forman parte del código versionado. La copia inicial `output/migration/vite-phase5-source.tar.gz` y el PDF de revisión permanecen únicamente en el entorno local.

La aprobación de esta migración es necesaria antes de comenzar funcionalidades de la fase 6.
