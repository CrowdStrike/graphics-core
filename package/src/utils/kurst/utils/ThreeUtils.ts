import type { Material, Mesh, Object3D } from 'three';

export class ThreeUtils {
  /**
   * get absolute scale for an object in the THREE.JS scene graph
   * @param obj : THREE.Object3D
   * @param scale : Number
   * @returns {number}
   */
  static getAbsoluteScale(obj: Object3D, scale = 1) {
    scale = scale * obj.scale.x;

    if (obj.parent !== null) {
      scale = ThreeUtils.getAbsoluteScale(obj.parent, scale);
    }

    return scale;
  }

  static getVisibleMesh(object3D: Object3D): Mesh | undefined {
    let mesh: Mesh | undefined = undefined;

    object3D.traverseVisible((object) => {
      if (!mesh && object.type === 'Mesh') {
        mesh = object as Mesh;
      }
    });

    return mesh;
  }

  /**
   * dispose a displayObject and all it's children: kill geometries and materials
   *
   * @param displayObject
   */
  static disposeAllChildren(displayObject: Object3D | Mesh) {
    if (displayObject.type === 'Mesh' && (displayObject as Mesh).geometry) {
      (displayObject as Mesh).geometry.dispose();
    }

    if (
      displayObject.type === 'Mesh' &&
      (displayObject as Mesh).material &&
      !Array.isArray((displayObject as Mesh).material)
    ) {
      if (!Array.isArray((displayObject as Mesh).material)) {
        let m = (displayObject as Mesh).material as Material;

        m.dispose();
      }
    }

    if (displayObject.children) {
      let child;

      while (displayObject.children.length) {
        child = displayObject.children[0] as Object3D<Event>;
        displayObject.remove(child);

        if (child.children) {
          ThreeUtils.disposeAllChildren(child);
        }
      }
    }
  }
}
