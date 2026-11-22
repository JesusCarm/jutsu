export class BandFieldResolver {
  resolve(data: unknown, path: string): unknown {
    let value = data;
    for (const key of path.split('.')) {
      if (value == null) return null;
      if (Array.isArray(value) && /^\d+$/.test(key) && Number(key) >= value.length) return null;
      if (typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key)) {
        throw new Error(`Unknown band data path: ${path}`);
      }
      value = (value as Record<string, unknown>)[key];
    }
    return value;
  }
}
