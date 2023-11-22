/**
 * Pseudo random number generator
 *
 * Usage:
 *
 * var randGenerator = new Random( 1 );
 *     randGenerator.next(); // get a random number
 *     randGenerator.seed( 2) ;// reseed
 *
 */

const r1 = 1234.5678;
const r2 = 5678.9101112;
const r3 = 9101112.13141516;

export class Random {
  private readonly rcp: number;
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  private e: number;
  private f: number;

  constructor(seed = 1) {
    this.rcp = 1 / (r1 + r2 + r3);
    this.a = (r1 + r2 + seed) % r1;
    this.b = (r2 + r3 + seed) % r2;
    this.c = (r3 + r1 + seed) % r3;
    this.d = 0;
    this.e = 0;
    this.f = 0;
  }

  seed(seed: number) {
    seed = Math.abs(seed | 0);
    this.a = (r1 + r2 + seed) % r1;
    this.b = (r2 + r3 + seed) % r2;
    this.c = (r3 + r1 + seed) % r3;
    this.d = 0;
    this.e = 0;
    this.f = 0;
  }

  next() {
    this.a = (r1 * this.a) % r1;
    this.b = (r2 * this.b) % r2;
    this.c = (r3 * this.c) % r3;
    this.d = (r1 * this.a + this.d) % r1;
    this.e = (r2 * this.b + this.e) % r2;
    this.f = (r3 * this.c + this.f) % r3;

    return (this.d + this.e + this.f) * this.rcp;
  }
}
