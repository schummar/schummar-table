export class MultiMap<K, V> extends Map<K, Set<V>> {
  set(key: K, value: V | Set<V>): this {
    let set: Set<V>;
    if (value instanceof Set) {
      set = value;
    } else {
      set = this.get(key) ?? new Set();
      set.add(value);
    }
    super.set(key, set);
    return this;
  }

  delete(key: K, value?: V): boolean {
    if (value === undefined) return super.delete(key);
    const set = new Set(this.get(key));
    const deleted = set.delete(value);
    if (set.size > 0) super.set(key, set);
    else super.delete(key);
    return deleted;
  }
}
