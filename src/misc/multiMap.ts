export class MultiMap<K, V> extends Map<K, V[]> {
  set(key: K, value: V | V[]): this {
    let entry;
    if (value instanceof Array) {
      entry = value;
    } else {
      entry = (this.get(key) ?? []).concat(value);
    }
    super.set(key, entry);
    return this;
  }

  delete(key: K, value?: V): boolean {
    if (value === undefined) return super.delete(key);
    const entry = this.get(key);
    const updated = entry?.filter((v) => v !== value);
    if (updated?.length) super.set(key, updated);
    else super.delete(key);
    return updated?.length !== entry?.length;
  }
}
