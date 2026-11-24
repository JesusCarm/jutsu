import type { ActionCost, EquipmentDefinition, RuleParameters } from './game-types';
import { copyParameters } from './rule-values';
export class EquipmentEntry {
  readonly id: string;
  readonly parameters: RuleParameters;
  readonly cost: ActionCost | null;

  constructor(definition: EquipmentDefinition | null = null) {
    const cost = definition?.cost ?? null;
    if (definition !== null && (typeof definition.id !== 'string' || !definition.id
      || !cost || !Number.isFinite(cost.amount) || cost.amount < 0 || cost.unit !== 'action')) {
      throw new TypeError('Equipment must define its ID and numeric action cost.');
    }
    this.id = definition?.id ?? '';
    this.parameters = copyParameters(definition?.parameters ?? {});
    this.cost = cost ? Object.freeze({ ...cost }) : null;
    Object.freeze(this);
  }
}
