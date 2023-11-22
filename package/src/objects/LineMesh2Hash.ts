import type { ILineMesh2 } from './LineMesh2';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

class Line2Dictionary {
  dictionary: Record<string, ILineMesh2> = {};
  width?: number;
  height?: number;
  add(line: ILineMesh2) {
    if (this.width != undefined && this.height !== undefined) {
      (line.material as LineMaterial).resolution.set(this.width, this.height);
    }

    this.dictionary[line.uuid] = line;
  }

  remove(line: ILineMesh2) {
    delete this.dictionary[line.uuid];
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    Object.values(this.dictionary).forEach((line) => {
      (line.material as LineMaterial).resolution.set(w, h);
    });
  }

  dispose() {
    this.dictionary = {};
  }
}

export const line2Dictionary = new Line2Dictionary();
