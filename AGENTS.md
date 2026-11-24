# Project conventions

- Keep repository documentation, comments, and user-facing text in English.
- Angular components use `name.component.ts` files and `NameComponent` classes.
- Give each component its own directory, with `name.component.html` and `name.component.scss` next to its TypeScript file. The root component lives in `src/app/`; a feature's main component may live directly in that feature's directory.
- Use `templateUrl` and `styleUrl`. Keep static HTML and styles outside the TypeScript file.
- Use SCSS; do not create `.css` stylesheets. Component-specific styles belong in the component's SCSS; `src/styles.scss` contains the theme, shared controls, and global utilities.
- Injectable services use `name.service.ts` files and `NameService` classes. Apply the `.directive`, `.pipe`, `.guard`, `.resolver`, and other type suffixes where appropriate.
- Place tests next to the file under test and preserve its suffix: `name.component.spec.ts`, `name.service.spec.ts`, and so on.
- Keep these settings in the `angular.json` schematics for files generated later.
- Keep domain and PDF engine classes independent of Angular, with a single responsibility. Do not turn them into services just to add a suffix.
- After code changes, run `npm run typecheck`, `npm test`, and `npm run build`.
