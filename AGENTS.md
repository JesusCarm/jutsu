# Convenciones del proyecto

- Los componentes Angular usan archivos `nombre.component.ts` y clases `NombreComponent`.
- Cada componente tiene su carpeta y sus archivos `nombre.component.html` y `nombre.component.scss` junto al TypeScript. El componente raíz ocupa `src/app/` y el principal de una funcionalidad puede ocupar la carpeta de esa funcionalidad.
- Usar `templateUrl` y `styleUrl`. Mantener el HTML y los estilos estáticos fuera del archivo TypeScript.
- Usar SCSS; no crear hojas `.css`. Los estilos propios pertenecen al SCSS del componente; `src/styles.scss` contiene el tema, los estilos compartidos y las utilidades globales.
- Los servicios inyectables usan `nombre.service.ts` y clases `NombreService`. Aplicar también los sufijos `.directive`, `.pipe`, `.guard`, `.resolver`, etc. cuando corresponda.
- Las pruebas se colocan junto al archivo probado y conservan su sufijo: `nombre.component.spec.ts`, `nombre.service.spec.ts`, etc.
- Mantener estas opciones en los schematics de `angular.json` para los archivos que se generen posteriormente.
- Conservar las clases de dominio y del motor PDF independientes de Angular y con una sola responsabilidad; no convertirlas en servicios solo para añadir un sufijo.
- Tras cambios de código, ejecutar `npm run typecheck`, `npm test` y `npm run build`.
