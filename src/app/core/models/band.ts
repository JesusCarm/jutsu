import { Ninja } from './ninja';

export class Band {
  name = '';
  readonly ninjas: Ninja[];

  constructor() {
    this.ninjas = Array.from({ length: 3 }, () => new Ninja());
  }
}
