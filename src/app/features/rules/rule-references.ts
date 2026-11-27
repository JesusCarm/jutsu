import references from '../../../assets/rules/references.json';
import type { StatName } from '../../core/models/game-types';
import type { Language } from '../../core/i18n/languages';

export type RuleId = keyof typeof references;
export interface RuleReference { readonly file: string; readonly anchor: string; readonly related?: readonly RuleId[]; }
export const RULE_REFERENCES = references as Readonly<Record<RuleId, RuleReference>>;
export function isRuleId(value: string): value is RuleId { return Object.hasOwn(RULE_REFERENCES, value); }
export function ruleDocumentPath(id: RuleId, language: Language): string {
  return `rules/${language}/${RULE_REFERENCES[id].file}`;
}

export const STAT_RULES = {
  attack: 'attack-stat', defense: 'defense-stat', movement: 'movement-stat',
  skill: 'skill', chakra: 'chakra', health: 'life',
} as const satisfies Record<StatName, RuleId>;

// Keep catalog IDs independent of translated names and editorial anchor spelling.
export const EQUIPMENT_RULES: Readonly<Record<string, RuleId | undefined>> = {
  kunai: 'kunai', shuriken: 'shuriken', explosiveSeal: 'explosive-tag', smokeBomb: 'smoke-bomb',
  soldierPill: 'soldier-pill', curryPill: 'curry-pill', cakePill: 'cake-pill',
};
export const TECHNIQUE_RULES: Readonly<Record<string, RuleId | undefined>> = {
  protectiveGate: 'jutsu-puerta-protectora', gateOfSpeed: 'jutsu-puerta-de-la-velocidad', gateOfStrength: 'jutsu-puerta-de-la-fuerza',
  surgery: 'jutsu-cirugia', substitution: 'jutsu-cambiazo', healing: 'jutsu-curacion',
  branchingShadow: 'jutsu-sombra-ramificada', transport: 'jutsu-transporte', shadowBind: 'jutsu-vinculo-sombrio',
  pressurePoints: 'jutsu-puntos-de-presion', nullification: 'jutsu-anulacion', whiteEye: 'jutsu-ojo-blanco',
  antiChakra: 'jutsu-anti-chakra', voidPalm: 'jutsu-palma-de-vacio', villageWhirlwind: 'jutsu-torbellino-de-la-villa',
  swap: 'jutsu-intercambio', redPupil: 'jutsu-pupila-roja', redEye: 'jutsu-ojo-rojo',
  phoenix: 'jutsu-fenix', flare: 'jutsu-llamarada', fireball: 'jutsu-bola-de-fuego',
  storm: 'jutsu-tormenta', wind: 'jutsu-viento', lightning: 'jutsu-rayo',
  desertTomb: 'jutsu-tumba-del-desierto', sandCloak: 'jutsu-manto-de-arena', quicksand: 'jutsu-arenas-movedizas',
  bodyMultiplication: 'jutsu-multiplicacion-de-cuerpos', clone: 'jutsu-clon', energyBall: 'jutsu-bola-de-energia',
  fourClaws: 'jutsu-cuatro-garras', skinShedding: 'jutsu-cambiapieles', animalPower: 'jutsu-potencia-animal',
  fireworks: 'jutsu-fuegos-artificiales', arsenal: 'jutsu-arsenal', steelRain: 'jutsu-lluvia-de-acero',
};
