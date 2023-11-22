import type { ObjectPool } from './ObjectPool';

export class ObjectPoolInterface<T> {
  pool: ObjectPool<T> | null;

  constructor() {
    this.pool = null;
  }

  pop(): T {
    if (!this.pool) {
      throw new Error('Pool was not defined');
    }

    return this.pool.pop();
  }

  push(o: T) {
    if (!this.pool) {
      throw new Error('Pool was not defined');
    }

    this.pool.push(o);
  }

  dispose() {
    if (!this.pool) {
      throw new Error('Pool was not defined');
    }

    this.pool.dispose();
  }

  getLength() {
    if (!this.pool) {
      throw new Error('Pool was not defined');
    }

    return this.pool.getLength();
  }
}
