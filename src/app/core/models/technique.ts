import type { ChakraCost, RuleParameters, TechniqueDefinition } from './game-types';
import { copyChakra, copyParameters } from './rule-values';
export class Technique {
  readonly id: string;
  readonly parameters: RuleParameters;
  readonly chakra: ChakraCost;
  readonly isMokushin: boolean;

  constructor({ id, parameters, chakra, isMokushin }: TechniqueDefinition) {
    if (typeof id !== 'string' || !id || typeof isMokushin !== 'boolean') {
      throw new TypeError('A technique must define its ID and Mokushin value.');
    }
    this.id = id;
    this.parameters = copyParameters(parameters);
    this.chakra = copyChakra(chakra);
    this.isMokushin = isMokushin;
    Object.freeze(this);
  }
}
