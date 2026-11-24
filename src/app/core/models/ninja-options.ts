import type { StatName } from './game-types';

import ninjaTypes from '../../../assets/data/ninja-types.json';
import techniqueGroups from '../../../assets/data/technique-groups.json';

export const NINJA_TYPES: readonly string[] = ninjaTypes.map((type) => type.id);
export const TECHNIQUE_GROUPS: readonly string[] = techniqueGroups.map((group) => group.id);

export const NINJA_STATS: readonly StatName[] = [
  'attack',
  'defense',
  'movement',
  'skill',
  'chakra',
  'health',
];
