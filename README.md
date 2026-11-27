# Jutsu — Squad Builder

**Build your squad. Master your techniques. Enter the battlefield.**

The official companion app for **Jutsu**, a miniature-agnostic tactical ninja skirmish game developed by Gipsy Games.

Create and customize a squad of three ninjas, choose their techniques and equipment, and generate compact, printable character sheets for your tabletop battles.

## Features

- Three fully customizable ninjas per squad.
- Four ninja archetypes with predefined attributes.
- Twelve schools of jutsu.
- Weapon and equipment management.
- Compact character sheets for quick in-game reference.
- High-quality, print-ready vector PDF export.
- Responsive desktop and mobile interface.
- Light and dark themes.
- Multilingual architecture.
- Contextual rules help with diagrams and an English and Spanish quick reference.
- No account or backend required.

## About Jutsu

Jutsu is a fast-paced tabletop skirmish game focused on tactical decisions, chakra management and ninja combat.

Each player commands a squad of three ninjas in battles designed to last approximately 30 minutes.

The rules are free, and the game is miniature-agnostic. You can play with any miniatures you like — although we make some pretty cool ones ourselves.

## Discover more

- [Official website](https://gipsygames.com/jutsu-un-juego-de-escaramuzas-ninja/?utm_source=github&utm_medium=referral&utm_campaign=jutsu&utm_content=readme)
- [3D printable miniatures — MyMiniFactory](https://www.myminifactory.com/profile/gipsygames?utm_source=github&utm_medium=referral&utm_campaign=jutsu&utm_content=readme)
- [Instagram](https://www.instagram.com/gipsygames/)

## Technology stack

| Technology | Purpose |
|---|---|
| Angular 21 | Application framework |
| TypeScript | Application and game logic |
| Angular Signals | Reactive state management |
| Angular Material & CDK | User interface |
| pdf-lib | Client-side PDF generation |
| Web Workers | Background PDF processing |
| Vitest | Automated testing |
| Docker & Nginx | Containerization and hosting |
| GitHub Actions | CI/CD |
| CapRover | Production deployment |

## Getting started

Clone the repository:

```bash
git clone https://github.com/JesusCarm/jutsu.git
cd jutsu
npm ci
npm run dev
```

Open `http://localhost:4200`.

### Production build

```bash
npm run build
```

### Testing

```bash
npm test
npm run typecheck
```

## Architecture

The application separates game rules, presentation, state management and PDF generation.

All squad processing and document generation take place on the client side, without requiring a backend.

### Technical documentation

- [Deployment and CI/CD](docs/deployment.md)
- [Internationalization](docs/i18n.md)
- [UI and selection panels](docs/selection-panels.md)
- [Contextual rules and quick-reference content](docs/rules.md)
- [PDF generation engine](src/app/features/pdf-generator/README.md)
- [Angular migration](docs/migration/angular-migration.md)

## About Gipsy Games

Gipsy Games is an independent tabletop game project combining game design, digital sculpting, 3D printing, illustration and software development.

**Made for players, by players.**
