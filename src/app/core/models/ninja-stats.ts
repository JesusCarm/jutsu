import type { StatValues, StatName } from './game-types';
import { NINJA_STATS } from './ninja-options';

export class NinjaStats {
  readonly attack!: number | null;
  readonly defense!: number | null;
  readonly movement!: number | null;
  readonly skill!: number | null;
  readonly chakra!: number | null;
  readonly health!: number | null;

  constructor(values: StatValues | null = null) {
    for (const stat of NINJA_STATS) {
      if (values !== null && !Number.isFinite(values[stat])) {
        throw new TypeError(`Missing or invalid ninja stat: ${stat}`);
      }
      (this as Record<StatName, number | null>)[stat] = values === null ? null : values[stat];
    }
    Object.freeze(this);
  }
}
