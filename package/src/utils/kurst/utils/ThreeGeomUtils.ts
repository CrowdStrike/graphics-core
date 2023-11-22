import * as THREE from 'three';

export class ThreeGeomUtils {
  static TMP = new THREE.Vector3();
  static TMP2D = new THREE.Vector2();

  /**
   * Calculate a point in between two ThreeJS vectors
   * @param vectorA : THREE.Vector3
   * @param vectorB : THREE.Vector3
   * @param resultVector : THREE.Vector3 - result is passed to that vector
   * @param percentage : Number - percentage position of point
   * @returns {THREE.Vextor3} : resultVector
   */
  static pointInBetween(
    vectorA: THREE.Vector3,
    vectorB: THREE.Vector3,
    resultVector: THREE.Vector3,
    percentage: number,
  ) {
    ThreeGeomUtils.TMP.x = vectorB.x;
    ThreeGeomUtils.TMP.y = vectorB.y;
    ThreeGeomUtils.TMP.z = vectorB.z;

    let dir = ThreeGeomUtils.TMP.sub(vectorA);
    let len = dir.length();

    dir = dir.normalize().multiplyScalar(len * percentage);

    resultVector.x = vectorA.x;
    resultVector.y = vectorA.y;
    resultVector.z = vectorA.z;

    return resultVector.add(dir);
  }

  /**
   * Calculate a point in between two ThreeJS vectors
   * @param vectorA : THREE.Vector2
   * @param vectorB : THREE.Vector2
   * @param resultVector : THREE.Vector2 - result is passed to that vector
   * @param percentage : Number - percentage position of point
   * @returns {THREE.Vector2} : resultVector
   */
  static pointInBetween2D(
    vectorA: THREE.Vector2,
    vectorB: THREE.Vector2,
    resultVector: THREE.Vector2,
    percentage: number,
  ) {
    ThreeGeomUtils.TMP2D.x = vectorB.x;
    ThreeGeomUtils.TMP2D.y = vectorB.y;

    let dir = ThreeGeomUtils.TMP2D.sub(vectorA);
    let len = dir.length();

    dir = dir.normalize().multiplyScalar(len * percentage);

    resultVector.x = vectorA.x;
    resultVector.y = vectorA.y;

    return resultVector.add(dir);
  }
}
