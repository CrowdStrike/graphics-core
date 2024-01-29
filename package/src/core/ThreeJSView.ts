import * as THREE from 'three';
import { OrthographicCamera } from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

import { IconGenerator } from '../generators/IconGenerator';
import { LabelGenerator } from '../generators/LabelGenerator';
import { EventDispatcher } from '../graph-utils-v2/events/event-dispatcher';
import { NumberUtils } from '../graph-utils-v2/utils/number-utils';
import { LineMesh } from '../objects/LineMesh';
import { LineMesh2 } from '../objects/LineMesh2';
import { line2Dictionary } from '../objects/LineMesh2Hash';
import { LineV2 } from '../objects/lines-v2/line-base';
import { BitmapComposer } from '../textures/graphics/BitmapComposer';
import { Rectangle } from '../utils/kurst/geom/Rectangle';
import { GeometryUtils } from '../utils/kurst/utils/GeometryUtils';
import { ThreeUtils } from '../utils/kurst/utils/ThreeUtils';
import { MaterialLibrary } from '../utils/MaterialLibrary';
import { MousePicker } from './MousePicker';

import type { Object3D } from 'three';
import type { WebGLRendererParameters } from 'three/src/renderers/WebGLRenderer';

interface FindClosestObjectToMouseResults {
  closestObjectDistance: number;
  mesh?: THREE.Object3D;
  box3: THREE.Box3;
  sizeTarget: THREE.Vector3;
  bound: Rectangle;
}

interface Disposable {
  dispose: () => void;
}

export class ThreeJSViewParams {
  clearColor = 0xffffff;
  containerElement?: HTMLElement;
  height = 800;
  isFullScreen = false;
  isOrthographic = true;
  itemsToDispose = [] as Disposable[];
  pixelDensity = 1;
  shouldAutomaticallySetPixelDensity?: boolean = true;
  shouldUseTrackBall = true;
  webGLRendererOptions?: WebGLRendererParameters;
  width = 800;

  constructor(webGLRendererOptions?: WebGLRendererParameters) {
    this.webGLRendererOptions = webGLRendererOptions;
  }
}

const FiveSecondsAt60FPS = 300;

THREE.ColorManagement.enabled = false;

export class ThreeJSView extends EventDispatcher {
  private static INSTANCES = 0;

  // WebGL Capbilities: Mutated once the renderer initializes and we know the context
  // Specifies how many textures we can fit in a shader texture array
  static GL_MAX_TEXTURE_IMAGE_UNITS = 1;
  // Max size for a texture
  static GL_MAX_TEXTURE_SIZE = 1024;

  _onCanvasMouseOutDelegate = () => this._onCanvasMouseOut();
  _onCanvasMouseOverDelegate = () => this._onCanvasMouseOver();
  _onWindowScrollDelegate = () => this._onWindowScroll();

  _dt?: number;
  _forceRender?: boolean;
  _cameraViewProjectionMatrix = new THREE.Matrix4();
  _containerElement?: HTMLElement;
  _frustum = new THREE.Frustum();
  _pixelDensity = 1;
  _projectTMPVector = new THREE.Vector3();
  _tmpBbox = new THREE.Box3();
  _tmpCameraPosition = new THREE.Vector3();
  _tmpMatrix = new THREE.Matrix4();
  _tmpVec = new THREE.Vector3();
  _unprojectResult = new THREE.Vector2();
  _unprojectTMPVector = new THREE.Vector3();
  ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
  camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  canvasRect: DOMRect;
  container = new THREE.Object3D();
  height: number;
  heightHalf: number;
  isFullScreen: boolean;
  isOrthographic: boolean;
  mousePicker: MousePicker;
  orthographicCamera: THREE.OrthographicCamera;
  perspectiveCamera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  shouldUseTrackBall: boolean;
  width: number;
  widthHalf: number;
  trackballControls?: TrackballControls;
  isDisposed = false;
  itemsToDispose: Disposable[] = [];
  frameCounter = 0;
  uuid: string;
  shouldAutomaticallySetPixelDensity = true;

  constructor({
    clearColor = 0x000000,
    containerElement,
    height = 600,
    isFullScreen = true,
    isOrthographic = true,
    itemsToDispose = [LabelGenerator, IconGenerator, BitmapComposer, MaterialLibrary],
    pixelDensity = 1,
    shouldAutomaticallySetPixelDensity = true,
    shouldUseTrackBall = true,
    webGLRendererOptions,
    width = 800,
  }: ThreeJSViewParams) {
    super();

    this.uuid = NumberUtils.generateUUID();

    ThreeJSView.INSTANCES++;

    let webglOptions = webGLRendererOptions || {
      alpha: 1,
      premultipliedAlpha: false,
      antialias: true,
    };

    this.shouldAutomaticallySetPixelDensity = shouldAutomaticallySetPixelDensity;
    this.itemsToDispose = itemsToDispose;
    this.height = height;
    this.heightHalf = height * 0.5;
    this.isOrthographic = isOrthographic;
    this.isFullScreen = isFullScreen;
    this.width = width;
    this.widthHalf = width * 0.5;
    this.scene.add(this.container);
    this.renderer = new THREE.WebGLRenderer(webglOptions as WebGLRendererParameters);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    ThreeJSView.GL_MAX_TEXTURE_IMAGE_UNITS = this.renderer.capabilities.maxTextures;
    ThreeJSView.GL_MAX_TEXTURE_SIZE = this.renderer.capabilities.maxTextureSize;
    this.mousePicker = new MousePicker({ threeView: this });
    this.shouldUseTrackBall = shouldUseTrackBall;
    this.orthographicCamera = new THREE.OrthographicCamera(
      -this.widthHalf,
      this.widthHalf,
      -this.heightHalf,
      this.heightHalf,
      0,
      80000,
    );
    this.perspectiveCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 6000);
    this.camera = this.isOrthographic ? this.orthographicCamera : this.perspectiveCamera;

    if (!(this.camera instanceof OrthographicCamera)) {
      this.camera.aspect = this.width / this.height;
    }

    this.camera.updateProjectionMatrix();
    this._containerElement = containerElement;
    this._pixelDensity = shouldAutomaticallySetPixelDensity ? calculatePixelDensity(pixelDensity) : pixelDensity;
    this.canvasRect = this.canvas.getBoundingClientRect();
    this._init(clearColor);
  }

  private _init(clearColor: number) {
    if (this.shouldUseTrackBall) {
      this.trackballControls = new TrackballControls(this.camera, this._containerElement);
      this.trackballControls.dynamicDampingFactor = 0.2;
      this.trackballControls.noPan = false;
      this.trackballControls.noZoom = false;
      this.trackballControls.panSpeed = 0.3;
      this.trackballControls.rotateSpeed = 3.0;
      this.trackballControls.staticMoving = false;
      this.trackballControls.zoomSpeed = 1.2;
      this.trackballControls.enabled = false;
    }

    this.scene.add(this.ambientLight);

    LineV2.prepareTextSpriteSheet();
    LineV2.prepareArrowMeshes();
    LineV2.addInstancedMeshesToScene(this);

    this.renderer.setPixelRatio(this._pixelDensity);
    this.renderer.setClearColor(clearColor);

    if (!this.isFullScreen) {
      window.addEventListener('scroll', this._onWindowScrollDelegate, {
        capture: true,
      });
    }

    this.canvas.addEventListener('mouseout', this._onCanvasMouseOutDelegate);
    this.canvas.addEventListener('mouseover', this._onCanvasMouseOverDelegate);
  }

  dispose() {
    ThreeJSView.INSTANCES--;

    this.isDisposed = true;
    this.mousePicker.dispose();
    line2Dictionary.dispose();

    if (ThreeJSView.INSTANCES === 0) {
      this.itemsToDispose.forEach((item: Disposable) => item?.dispose());
    }

    if (!this.isFullScreen) {
      window.removeEventListener('scroll', this._onWindowScrollDelegate, {
        capture: true,
      });
    }

    this.canvas.removeEventListener('mouseout', this._onCanvasMouseOutDelegate);
    this.canvas.removeEventListener('mouseover', this._onCanvasMouseOverDelegate);

    this.remove(this.container);
    this.scene.remove(this.ambientLight);

    this.renderer.dispose();
    this.renderer.forceContextLoss();

    ThreeUtils.disposeAllChildren(this.scene);

    if (this.trackballControls) {
      this.trackballControls.dispose();
      this.trackballControls = undefined;
    }

    super.dispose();
  }

  add(...object: THREE.Object3D[]) {
    this.container.add(...object);
  }

  remove(...object: THREE.Object3D[]) {
    this.container.remove(...object);
  }

  get canvas() {
    return this.renderer.domElement;
  }

  set enableTrackBall(flag) {
    this.shouldUseTrackBall = flag;

    if (this.trackballControls) {
      this.trackballControls.enabled = flag;
    }
  }

  get enableTrackBall() {
    return this.shouldUseTrackBall;
  }

  render(dt?: number, forceRender?: boolean) {
    if (this.isDisposed) {
      return;
    }

    this._dt = dt;
    this._forceRender = forceRender;

    if (this.shouldUseTrackBall) {
      this.trackballControls?.update();
    }

    this.mousePicker.render();
    this.renderer.render(this.scene, this.camera);
    this.frameCounter++;

    if (this.shouldAutomaticallySetPixelDensity && this.frameCounter % FiveSecondsAt60FPS === 1) {
      let newPixelDensity = calculatePixelDensity(window.devicePixelRatio);

      if (this._pixelDensity !== newPixelDensity) {
        this.renderer.setPixelRatio(newPixelDensity);
        this._pixelDensity = newPixelDensity;
      }

      this.frameCounter = 0;
    }
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.widthHalf = this.width * 0.5;
    this.heightHalf = this.height * 0.5;

    if (this.camera instanceof OrthographicCamera) {
      this.camera.left = -this.width / 2;
      this.camera.right = this.width / 2;
      this.camera.top = this.height / 2;
      this.camera.bottom = -this.height / 2;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.aspect = this.width / this.height;

      this.camera.updateProjectionMatrix();
    }

    this.canvasRect = this.canvas.getBoundingClientRect();
    this.renderer.setSize(this.width, this.height);

    this.mousePicker.resize();
    line2Dictionary.resize(w, h);
  }

  project(vector2: THREE.Vector2, z = 0) {
    this._projectTMPVector.x = (vector2.x / this.width) * 2 - 1;
    this._projectTMPVector.y = -(vector2.y / this.height) * 2 + 1;
    this._projectTMPVector.z = z;
    this._projectTMPVector.unproject(this.camera);

    if (this.camera.type === 'OrthographicCamera') {
      return this._projectTMPVector;
    }

    this._projectTMPVector.sub(this.camera.position).normalize();

    let distance = -this.camera.position.z / this._projectTMPVector.z;

    this._tmpCameraPosition.x = this.camera.position.x;
    this._tmpCameraPosition.y = this.camera.position.y;
    this._tmpCameraPosition.z = this.camera.position.z;

    return this._tmpCameraPosition.add(this._projectTMPVector.multiplyScalar(distance));
  }

  unproject(obj: THREE.Line | typeof LineMesh | typeof LineMesh2 | THREE.Vector3 | THREE.Object3D) {
    switch (true) {
      case obj instanceof LineMesh:
      case obj instanceof LineMesh2:
        this._unprojectTMPVector.set(
          this.mousePicker.intersectionPoint.x,
          this.mousePicker.intersectionPoint.y,
          this.mousePicker.intersectionPoint.z,
        );

        break;

      // case obj instanceof THREE.Line:
      //   ThreeGeomUtils.pointInBetween(
      //     (obj as THREE.Line).geometry.vertices[0],
      //     (obj as THREE.Line).geometry.vertices[1],
      //     this._unprojectTMPVector,
      //     0.5,
      //   );
      //
      //   break;

      case obj instanceof THREE.Vector3:
        this._unprojectTMPVector.set((obj as THREE.Vector3).x, (obj as THREE.Vector3).y, (obj as THREE.Vector3).z);

        break;

      default:
        this._unprojectTMPVector.setFromMatrixPosition((obj as THREE.Object3D).matrixWorld);

        break;
    }

    this._unprojectTMPVector.project(this.camera);
    this._unprojectTMPVector.x = this._unprojectTMPVector.x * this.widthHalf + this.widthHalf;
    this._unprojectTMPVector.y = -(this._unprojectTMPVector.y * this.heightHalf) + this.heightHalf;
    this._unprojectResult.x = this._unprojectTMPVector.x;
    this._unprojectResult.y = this._unprojectTMPVector.y;

    return this._unprojectResult;
  }

  intersectsFrustum(object: THREE.Mesh) {
    if (object.geometry !== null) {
      this.camera.updateMatrixWorld(); // make sure the camera matrix is updated

      this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();
      this._cameraViewProjectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);

      this._frustum.setFromProjectionMatrix(this._cameraViewProjectionMatrix);

      return this._frustum.intersectsObject(object);
    } else {
      return true; // assume the object is view if there is no geometry to test
    }
  }

  pointIntersectsFrustum(point: THREE.Vector3) {
    this.camera.updateMatrixWorld(); // make sure the camera matrix is updated
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();
    this._cameraViewProjectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._cameraViewProjectionMatrix);

    return this._frustum.containsPoint(point);
  }

  findClosestObjectToMouse(mesh: THREE.Object3D, classesToExclude = [], _result?: FindClosestObjectToMouseResults) {
    if (!_result) {
      _result = {
        closestObjectDistance: Infinity,
        mesh: undefined,
        box3: new THREE.Box3(),
        sizeTarget: new THREE.Vector3(),
        bound: new Rectangle(),
      };
    }

    if ((mesh as THREE.Mesh).geometry) {
      (mesh as THREE.Mesh).geometry.computeBoundingBox();

      let screenPos = this.unproject(mesh);

      _result.box3.makeEmpty();
      _result.box3.setFromObject(mesh);
      _result.box3.getSize(_result.sizeTarget);
      _result.bound.set(screenPos.x, screenPos.y, _result.sizeTarget.x, _result.sizeTarget.y);

      let shouldExclude = classesToExclude.some((ClassRef) => mesh instanceof ClassRef);
      let distance = GeometryUtils.distancePointToRectangle(this.mousePicker.mouse, _result.bound);

      if (distance < _result.closestObjectDistance && !shouldExclude) {
        _result.closestObjectDistance = distance;
        _result.mesh = mesh;
      }
    }

    for (let c = 0; c < mesh.children.length; c++) {
      this.findClosestObjectToMouse(mesh.children[c] as Object3D, classesToExclude, _result);
    }

    return _result;
  }

  /**
   * Note that zooming into the canvas of the graph,
   * (ie setting .scale in MouseControls) scales up the container.
   *
   * The returned bbox is zoom-dependant
   */
  get meshDimensions() {
    // We need to clear the previously defined bounding box first
    // so that we don't expand a pre-existing one.
    this._tmpBbox.makeEmpty();

    /**
     * THREE.InstancedMesh geometries can't compute their bounding box correctly,
     * so we need to find a functional way to determine it.
     * We do this by decomposing the matrix for all drawn instances and getting
     * its translation, then finding the bounding box of these points.
     */
    const instancedMeshes = this.container.children.filter((c) => {
      return c instanceof THREE.InstancedMesh;
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    instancedMeshes.forEach((instancedMesh: THREE.InstancedMesh) => {
      // Anything that extends InstancedAttributes includes the ability
      // to display a geometry or not at the shader level.
      const attributeAffectsDisplay = !!instancedMesh.geometry.attributes.instanceDisplay;

      // Take into account only those instances that are drawn
      for (let idx = 0; idx < instancedMesh.count; idx++) {
        // Is it hidden?
        if (attributeAffectsDisplay && instancedMesh.geometry.attributes.instanceDisplay.getX(idx) === 0) {
          continue;
        } else {
          // Extracting a single position
          // from a THREE.InstancedMesh https://jsfiddle.net/ew1tyz63/2/
          instancedMesh.getMatrixAt(idx, this._tmpMatrix);
          this._tmpVec.setFromMatrixPosition(this._tmpMatrix);
          this._tmpBbox.expandByPoint(this._tmpVec);
        }
      }
    });

    const nonInstancedMeshes = this.container.children.filter((c) => {
      return !(c instanceof THREE.InstancedMesh);
    });

    nonInstancedMeshes.forEach((nonInstancedMesh) => {
      this._tmpVec.copy(nonInstancedMesh.position);
      this._tmpBbox.expandByPoint(this._tmpVec);
    });

    this._tmpBbox.getSize(this._tmpVec);

    const width = this._tmpVec.x;
    const height = this._tmpVec.y;

    this._tmpBbox.getCenter(this._tmpVec);

    const center = {
      x: this._tmpVec.x,
      y: this._tmpVec.y,
    };

    return {
      height,
      width,
      center,
    };
  }

  centerContainer() {
    const { center } = this.meshDimensions;

    let scalar = ThreeUtils.getAbsoluteScale(this.container);

    this.container.position.x = -center.x * scalar;
    this.container.position.y = -center.y * scalar;
  }

  private _onWindowScroll() {
    this.canvasRect = this.canvas.getBoundingClientRect();
    this.mousePicker.resize();
  }

  private _onCanvasMouseOut() {
    if (this.trackballControls) {
      this.trackballControls.enabled = false;
    }
  }

  private _onCanvasMouseOver() {
    if (this.trackballControls) {
      this.trackballControls.enabled = true;
    }
  }
}

const pixelDensityUpscale = 0.5;

function calculatePixelDensity(pixelDensity: number) {
  return Math.min(pixelDensity + pixelDensityUpscale, 2);
}
