import ninjaTypes from '../../../assets/data/ninja-types.json';
import techniqueGroups from '../../../assets/data/technique-groups.json';
import equipment from '../../../assets/data/equipment.json';
import type { GameData } from '../models/game-types';

export const GAME_DATA: GameData = { ninjaTypes, techniqueGroups, ...equipment };
