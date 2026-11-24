import type { ChakraCost, RuleParameters } from './game-types';

export function copyParameters(parameters: RuleParameters): RuleParameters {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)
    || !Object.values(parameters).every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new TypeError('Rule parameters must be finite numbers.');
  }
  return Object.freeze({ ...parameters });
}

export function copyChakra(cost: ChakraCost): ChakraCost {
  const valid = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (valid(cost)) return cost;
  if (cost && typeof cost === 'object') {
    if ('min' in cost && valid(cost.min) && valid(cost.max) && cost.min <= cost.max) return Object.freeze({ ...cost });
    if ('initial' in cost && valid(cost.initial) && valid(cost.upkeep) && cost.unit === 'round') return Object.freeze({ ...cost });
  }
  throw new TypeError('A technique must define a numeric Chakra cost, range or upkeep.');
}
