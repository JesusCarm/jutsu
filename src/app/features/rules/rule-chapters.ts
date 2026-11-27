import { Labels, Rules, TechniqueGroups, type TranslationKey } from '../../core/i18n/i18n-keys';

/** Reading order for the complete reference, sharing the contextual rule sources. */
export const RULE_CHAPTERS: readonly { readonly file: string; readonly title: TranslationKey }[] = [
  { file: 'attributes.md', title: Labels.statistics },
  { file: 'basic-concepts.md', title: Rules.chapters.basicConcepts },
  { file: 'game-flow.md', title: Rules.chapters.gameFlow },
  { file: 'combat.md', title: Rules.chapters.combat },
  { file: 'actions.md', title: Rules.chapters.actions },
  { file: 'team-creation.md', title: Rules.chapters.teamCreation },
  { file: 'equipment.md', title: Labels.equipment },
  { file: 'jutsus/taijutsu.md', title: TechniqueGroups.taijutsu },
  { file: 'jutsus/medico.md', title: TechniqueGroups.medical },
  { file: 'jutsus/sombra.md', title: TechniqueGroups.shadow },
  { file: 'jutsus/blandas.md', title: TechniqueGroups.softTechniques },
  { file: 'jutsus/defensa-blanda.md', title: TechniqueGroups.softDefense },
  { file: 'jutsus/ilusorias.md', title: TechniqueGroups.illusionTechniques },
  { file: 'jutsus/igneas.md', title: TechniqueGroups.fireTechniques },
  { file: 'jutsus/atmosfericas.md', title: TechniqueGroups.weatherTechniques },
  { file: 'jutsus/tierra.md', title: TechniqueGroups.earthTechniques },
  { file: 'jutsus/ocultas.md', title: TechniqueGroups.hiddenTechniques },
  { file: 'jutsus/espiritu-animal.md', title: TechniqueGroups.animalSpirit },
  { file: 'jutsus/invocacion.md', title: TechniqueGroups.weaponSummoning },
];
