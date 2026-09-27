/**
 * Fast, deterministic Mulberry32 Pseudo-Random Number Generator.
 * Guarantees 100% identical simulation and combat replay across clients and headless runner.
 */
export class PRNG {
  private s: number;

  constructor(seed: number) {
    this.s = Math.floor(seed) >>> 0;
    if (this.s === 0) this.s = 1337;
  }

  /** Returns float in [0, 1) */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns float in [min, max) */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Pick random item from array */
  choice<T>(items: T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  /** Shuffle array in-place deterministically */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getSeed(): number {
    return this.s;
  }
}
