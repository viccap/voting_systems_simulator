export class LcgRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 123456789;
    }
  }

  next(): number {
    // LCG parameters from Numerical Recipes
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }

  uniform(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  normal(mean = 0, std = 1): number {
    // Box-Muller transform
    const u1 = Math.max(this.next(), 1e-12);
    const u2 = this.next();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    return mean + std * mag * Math.cos(2 * Math.PI * u2);
  }
}
