import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

import { TextStyle } from '../../data/TextStyle';
import { InstancedMeshAttributes } from '../../entities/instanced-mesh-attributes';
import { InstancedTextAttributes } from '../../entities/instanced-text-attributes';
import { LineGradientMaterial } from '../../materials/LineGradientMaterial';
import { ThreeGeomUtils } from '../../utils/kurst/utils/ThreeGeomUtils';

import type { ThreeJSView } from '../../core/ThreeJSView';

export class DefaultLineV2Settings implements LineV2Settings {
  color = 0x000000;
  endColor = 0x000000;
  hasStartArrow = false;
  hasEndArrow = false;
  startArrowPosition = 0;
  startArrowRotation = 0;
  endArrowPosition = 1;
  endArrowRotation = 0;
  label = '';
  labelSize = 12;
  labelColor = 0xffffff;
  showDebugMode = false;
  isDashed = false;
  dashOffset = 0;
  dashScale = 1;
  dashSize = 1;

  useInstancedArrows = true;

  startWidth = 1;
  endWidth = 1;

  start: [number, number, number] = [0, 0, 0];
  end: [number, number, number] = [100, 0, 0];
}

export type LineV2Settings = Partial<DefaultLineV2Settings>;

export type LineV2Type = 'straight' | 'quadratic' | 'cubic';

// TODO Pass text rendering options to the line
// This can be the defaults
const lineV2TextStyle = new TextStyle();

lineV2TextStyle.fontSize = 20;
lineV2TextStyle.fontColor = 0xff0000;
lineV2TextStyle.fontName = 'Helvetica Neue';
lineV2TextStyle.pixelDensity = 2;

export class LineV2 extends Line2 {
  static ARROW_GEOMETRY?: THREE.CylinderGeometry;
  static TEXT_STYLE = lineV2TextStyle;
  static HALF_PI = Math.PI / 2;
  static tmpVec = new THREE.Vector3();
  static tmpVec2 = new THREE.Vector3();
  static mesh = new THREE.Mesh();

  static labels: InstancedTextAttributes;
  static arrows: InstancedMeshAttributes<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;

  showDebugMode = false;
  useInstancedArrows = true;

  lineType: LineV2Type;

  /**
   * this.settings holds all the default and overriden parameters for these lines,
   * as they are instantiated at runtime
   */
  settings: Required<LineV2Settings>;

  _startArrowPosition = 0;
  _endArrowPosition = 1;

  startArrowRotation = 0;
  endArrowRotation = 0;

  endArrowMesh?: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  startArrowMesh?: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;

  direction = new THREE.Vector3();
  axis = new THREE.Vector3();
  qt = new THREE.Quaternion();

  labelInstanceIdx?: number;
  protected startArrowInstanceIdx?: number;
  protected endArrowInstanceIdx?: number;

  readonly vec3 = new THREE.Vector3();
  readonly _start = new THREE.Vector3();
  readonly _end = new THREE.Vector3();
  readonly _color = new THREE.Color(0xffffff);
  readonly _endColor = new THREE.Color(0xffffff);
  readonly _positions: number[] = [];
  readonly _colors: number[] = [];

  // these values are used to persist the arrow-related configuration
  hasStartArrow: boolean;
  hasEndArrow: boolean;

  // these values are used for getters and setters so that we know
  // whether the start/end arrow is currently rendered
  // (regardless if instanced or not)
  _isEndArrowVisible = false;
  _isStartArrowVisible = false;

  private _labelIsVisible = false;
  private _labelSize = 24;
  private _label?: string;

  declare material: LineGradientMaterial;

  /**
   * If TextGenerator doesn't have an existing Canvas spritesheet,
   * we need to make one.
   */
  static prepareTextSpriteSheet() {
    LineV2.labels = new InstancedTextAttributes({
      truncationLength: 100,
      truncationStrategy: 'end',
      pixelDensity: 2,
    });

    LineV2.labels.registerTextStyle(lineV2TextStyle);
    LineV2.labels.mesh.material.side = THREE.DoubleSide;
  }

  static prepareArrowMeshes() {
    LineV2.arrows = new InstancedMeshAttributes({
      geometry: new THREE.CylinderGeometry(0, 0.5, 2, 5, 1),
      material: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        vertexColors: true,
        transparent: true,
      }),
    });
    LineV2.arrows.mesh.geometry.translate(0, 0.25, 1);
    LineV2.arrows.mesh.geometry.computeBoundingBox();
  }

  /**
   * This method is called from the ThreeJSView class.
   *
   * Every time a new scene is created, the instanced meshes used for lines
   * are also added.
   */
  static addInstancedMeshesToScene(scene: THREE.Scene | ThreeJSView | THREE.Object3D) {
    LineV2.labels.shouldDispatchMouseEvents = true;

    /**
     * addMeshToScene ensures that these meshes are only added once per scene.
     */
    LineV2.arrows.addMeshToScene(scene);
    LineV2.labels.addMeshToScene(scene);

    LineV2.arrows.mesh.position.z = 0;
    LineV2.labels.mesh.position.z = 0;
  }

  constructor(settings: LineV2Settings) {
    super(new LineGeometry(), new LineGradientMaterial({}));

    if (!LineV2.labels) {
      LineV2.prepareTextSpriteSheet();
    }

    if (!LineV2.arrows) {
      LineV2.prepareArrowMeshes();
    }

    this.settings = { ...new DefaultLineV2Settings(), ...settings };

    this.lineType = 'straight';

    if (this.settings.label && this.settings.label !== '') {
      this.setLabel(this.settings.label);

      if (this.settings.labelColor) {
        this.setLabelColor(this.settings.labelColor);
      }

      this.labelSize = this.settings.labelSize;
    }

    this.useInstancedArrows = this.settings.useInstancedArrows;

    this.showDebugMode = this.settings.showDebugMode;

    if (!LineV2.ARROW_GEOMETRY && !this.useInstancedArrows) {
      LineV2.ARROW_GEOMETRY = new THREE.CylinderGeometry(0, 0.5, 1, 5, 1);
      LineV2.ARROW_GEOMETRY.translate(0, 0.25, 0);
      LineV2.ARROW_GEOMETRY.computeBoundingBox();
    }

    this.hasStartArrow = this.settings.hasStartArrow;
    this.hasEndArrow = this.settings.hasEndArrow;

    this.isStartArrowVisible = this.hasStartArrow;
    this.isEndArrowVisible = this.hasEndArrow;

    this.startArrowPosition = this.settings.startArrowPosition;
    this.endArrowPosition = this.settings.endArrowPosition;
    this.startArrowRotation = this.settings.startArrowRotation;
    this.endArrowRotation = this.settings.endArrowRotation;

    this.material.vertexColors = true;
    this.material.dashed = this.settings.isDashed ?? false;
    this.material.dashOffset = this.settings.dashOffset;
    this.material.dashScale = this.settings.dashScale;
    this.material.dashSize = this.settings.dashSize;
    this.material.worldUnits = true;

    this.lineWidth = this.settings.startWidth;

    this.endLineWidth = this.settings.endWidth;

    this.setStart(LineV2.tmpVec.set(this.settings.start[0], this.settings.start[1], this.settings.start[2]));

    this.setEnd(LineV2.tmpVec.set(this.settings.end[0], this.settings.end[1], this.settings.end[2]));

    this.setColor(this.settings.color, this.settings.endColor);
  }

  dispose() {
    this.material.dispose();
    this.geometry.dispose();

    if (typeof this.labelInstanceIdx === 'number') {
      LineV2.labels.remove({ id: this.labelInstanceId });
    }

    if (this.isStartArrowVisible) {
      if (this.useInstancedArrows) {
        if (typeof this.startArrowInstanceIdx === 'number') {
          LineV2.arrows.remove({ id: this.startArrowInstanceId });
        }
      } else {
        this.startArrowMesh && this.remove(this.startArrowMesh);
        this.startArrowMesh = null as never;
      }
    }

    if (this.isEndArrowVisible) {
      if (this.useInstancedArrows) {
        if (typeof this.endArrowInstanceIdx === 'number') {
          LineV2.arrows.remove({ id: this.endArrowInstanceId });
        }
      } else {
        this.endArrowMesh && this.remove(this.endArrowMesh);
        this.endArrowMesh = null as never;
      }
    }

    this.parent?.remove(this);
  }

  protected positionInBetween(
    target: THREE.Mesh | THREE.Vector3,
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    percentPosition: number,
    offset = 0,
  ) {
    ThreeGeomUtils.pointInBetween(startPoint, endPoint, this.vec3, percentPosition);

    if (target instanceof THREE.Mesh) {
      target.position.set(
        this.vec3.x + this.direction.x * offset,
        this.vec3.y + this.direction.y * offset,
        this.vec3.z + this.direction.z * offset,
      );
    } else {
      target.set(
        this.vec3.x + this.direction.x * offset,
        this.vec3.y + this.direction.y * offset,
        this.vec3.z + this.direction.z * offset,
      );
    }

    return target;
  }

  protected updateDirection(startPoint: THREE.Vector3, endPoint: THREE.Vector3) {
    this.direction.set(endPoint.x, endPoint.y, endPoint.z);
    this.direction.sub(startPoint);
    this.direction.normalize();
  }

  protected align(mesh?: THREE.Mesh) {
    if (this.direction.y > 0.99999) {
      this.qt.set(0, 0, 0, 1);
    } else if (this.direction.y < -0.99999) {
      this.qt.set(1, 0, 0, 0);
    } else {
      this.axis.set(this.direction.z, 0, -this.direction.x).normalize();
      this.qt.setFromAxisAngle(this.axis, Math.acos(this.direction.y));
    }

    if (mesh) {
      mesh.quaternion.copy(this.qt);
    }

    return this.qt;
  }

  public update() {
    this.setPositions();

    this.updateElements();
    this.computeLineDistances();
  }

  /**
   * Sets the number of total instances as a uniform
   * to the shader.
   *
   * This enables us to do things like gradients and
   * variable visibility offsets in the shader
   */
  protected setTotalLineSegmentInstanceCounts() {
    this.material.totalLineSegmentInstances = this.geometry.getAttribute('instanceStart').count;
  }

  protected setPositions() {
    this._positions.length = 0;
    this._positions.push(this.start.x, this.start.y, this.start.z);
    this._positions.push(this.end.x, this.end.y, this.end.z);
    this.geometry.setPositions(this._positions);

    this.setTotalLineSegmentInstanceCounts();
  }

  protected setGradient(start: THREE.Color, end: THREE.Color) {
    this.material.gradientStart = start;
    this.material.gradientEnd = end;
  }

  protected assignColorsToVariables(color: THREE.Color | number, endColor?: THREE.Color | number) {
    if (color instanceof THREE.Color) {
      this.color.set(color);
    } else if (typeof color === 'number') {
      this._color.setHex(color);
    }

    if (endColor) {
      if (endColor instanceof THREE.Color) {
        this.endColor.set(endColor);
      } else if (typeof endColor === 'number') {
        this.endColor.setHex(endColor);
      }
    } else {
      this.endColor.copy(this.color);
    }
  }

  protected setArrowColors(color: THREE.Color, endColor: THREE.Color) {
    if (this.useInstancedArrows) {
      if (typeof this.startArrowInstanceIdx === 'number') {
        LineV2.arrows.setColor(this.startArrowInstanceIdx, color);
      }

      if (typeof this.endArrowInstanceIdx === 'number') {
        LineV2.arrows.setColor(this.endArrowInstanceIdx, endColor);
      }
    } else {
      this.startArrowMesh?.material.color.set(color);
      this.endArrowMesh?.material.color.set(endColor);
    }
  }

  public setEndColor(endColor: THREE.Color | number) {
    this.setColor(this.color, endColor);
  }

  // Set color or, optionally, gradient
  public setColor(color: THREE.Color | number, endColor?: THREE.Color | number) {
    this.assignColorsToVariables(color, endColor);

    // this.color.set(color);
    this._colors.length = 0;
    this._colors.push(
      // color for point A
      this.color.r,
      this.color.g,
      this.color.b,
      // color for point B
      this.endColor.r,
      this.endColor.g,
      this.endColor.b,
    );

    this.geometry.setColors(this._colors);

    this.setGradient(this.color, this.endColor);

    this.setArrowColors(this.color, this.endColor);
  }

  public updateElements() {
    this.updateArrows();
    this.updateLabel();
  }

  protected updateArrows() {
    if (this.useInstancedArrows) {
      // this updates this.direction
      this.updateDirection(this.end, this.start);

      if (typeof this.startArrowInstanceIdx === 'number') {
        this.align(LineV2.mesh);

        if (this.startArrowRotation !== 0) {
          LineV2.mesh.rotateZ(this.startArrowRotation);
          LineV2.mesh.quaternion;
        }

        LineV2.arrows.setRotation(this.startArrowInstanceIdx, LineV2.mesh.quaternion);

        if (this.startArrowPosition !== 0) {
          this.positionInBetween(this.vec3, this.start, this.end, this.startArrowPosition);
        } else {
          this.vec3.copy(this.start);
        }

        LineV2.arrows.setPosition(this.startArrowInstanceIdx, this.vec3.x, this.vec3.y, this.vec3.z + 1);

        LineV2.arrows.setScale(this.startArrowInstanceIdx, this.startArrowScale, this.startArrowScale, 0.1);
      }

      // this updates this.direction
      this.updateDirection(this.start, this.end);

      if (typeof this.endArrowInstanceIdx === 'number') {
        this.align(LineV2.mesh);

        if (this.endArrowRotation !== 0) {
          LineV2.mesh.rotateZ(this.endArrowRotation);
          LineV2.mesh.quaternion;
        }

        LineV2.arrows.setRotation(this.endArrowInstanceIdx, LineV2.mesh.quaternion);

        if (this.endArrowPosition !== 1) {
          this.positionInBetween(this.vec3, this.start, this.end, this.endArrowPosition);
        } else {
          this.vec3.copy(this.end);
        }

        LineV2.arrows.setPosition(this.endArrowInstanceIdx, this.vec3.x, this.vec3.y, this.vec3.z + 1);

        LineV2.arrows.setScale(this.endArrowInstanceIdx, this.endArrowScale, this.endArrowScale, 0.1);
      }
    } else {
      if (this.startArrowMesh) {
        this.updateDirection(this.end, this.start);
        this.align(this.startArrowMesh);
        this.startArrowMesh.scale.set(this.startArrowScale, this.startArrowScale, 0.1);
        this.startArrowMesh?.position.set(this.start.x, this.start.y, this.start.z);
      }

      if (this.endArrowMesh) {
        this.updateDirection(this.start, this.end);
        this.align(this.endArrowMesh);
        this.endArrowMesh.scale.set(this.endArrowScale, this.endArrowScale, 0.1);

        this.endArrowMesh?.position.set(this.end.x, this.end.y, this.end.z);
      }
    }
  }

  get color() {
    return this._color;
  }

  get endColor() {
    return this._endColor;
  }

  get isStartArrowVisible() {
    return this._isStartArrowVisible;
  }

  set isStartArrowVisible(v: boolean) {
    this._isStartArrowVisible = v;

    const dimension = Math.max(5, this.lineWidth * 2);

    if (this.isStartArrowVisible) {
      if (this.useInstancedArrows) {
        this.startArrowInstanceIdx = LineV2.arrows.add({ id: this.startArrowInstanceId });
        LineV2.arrows.setScale(this.startArrowInstanceIdx, dimension, dimension, 0.1);
      } else {
        this.startArrowMesh = new THREE.Mesh(LineV2.ARROW_GEOMETRY);
        this.startArrowMesh.scale.set(dimension, dimension, 0.1);
        this.add(this.startArrowMesh);
      }

      this.updateArrows();
    } else {
      if (this.useInstancedArrows) {
        if (typeof this.startArrowInstanceIdx === 'number') {
          LineV2.arrows.remove({ id: this.startArrowInstanceId });
          this.startArrowInstanceIdx = undefined;
        }
      } else {
        if (this.startArrowMesh) {
          this.remove(this.startArrowMesh);
        }
      }
    }
  }

  get isEndArrowVisible() {
    return this._isEndArrowVisible;
  }

  set isEndArrowVisible(v: boolean) {
    this._isEndArrowVisible = v;

    const dimension = Math.max(5, this.endLineWidth * 2);

    if (this.isEndArrowVisible) {
      if (this.useInstancedArrows) {
        this.endArrowInstanceIdx = LineV2.arrows.add({ id: this.endArrowInstanceId });
        LineV2.arrows.setScale(this.endArrowInstanceIdx, dimension, dimension, 0.1);
      } else {
        this.endArrowMesh = new THREE.Mesh(LineV2.ARROW_GEOMETRY);
        this.endArrowMesh.scale.set(dimension, dimension, 0.1);
        this.add(this.endArrowMesh);
      }

      this.updateArrows();
    } else {
      if (this.useInstancedArrows) {
        if (typeof this.endArrowInstanceIdx === 'number') {
          LineV2.arrows.remove({ id: this.endArrowInstanceId });
          this.endArrowInstanceIdx = undefined;
        }
      } else {
        if (this.endArrowMesh) {
          this.remove(this.endArrowMesh);
        }
      }
    }
  }

  get label() {
    return this._label;
  }

  protected updateLabel() {
    if (this.label && typeof this.labelInstanceIdx === 'number') {
      let angle = Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
      let dir = angle > 0 ? 1 : -1;
      let offset = this.lineWidth * dir + this.labelSize * dir;

      this.positionInBetween(this.vec3, this.start, this.end, 0.5);
      LineV2.labels.setPosition(
        this.labelInstanceIdx,
        this.vec3.x + Math.sin(angle) * offset,
        this.vec3.y - Math.cos(angle) * offset,
        this.position.z + 1,
      );

      this.positionInBetween(LineV2.mesh, this.start, this.end, 0.5);
      this.align(LineV2.mesh);
      LineV2.mesh.rotation.z += LineV2.HALF_PI;

      if (LineV2.mesh.rotation.z - LineV2.HALF_PI > 0) {
        LineV2.mesh.rotation.z += Math.PI;
      }

      LineV2.labels.setRotation(
        this.labelInstanceIdx,
        this.qt.setFromAxisAngle(this.vec3.set(0, 0, 1), LineV2.mesh.rotation.z),
      );
    }
  }

  setLabel(txt: string, colorHex = 0xffffff, style?: TextStyle) {
    this.settings.label = txt;
    this._label = txt;

    if (!style) {
      style = LineV2.TEXT_STYLE;
      style.fontColor = colorHex;
    }

    this.labelInstanceIdx = LineV2.labels.add({ id: this.labelInstanceId });
    LineV2.labels.updateTextAt(this.labelInstanceIdx, txt);
    LineV2.labels.setIconColor(this.labelInstanceIdx, colorHex);

    this.setLabelScale(this.labelSize);
    this.updateLabel();

    return this.label;
  }

  setLabelColor(colorHex = 0xffffff) {
    this.settings.labelColor = colorHex;

    if (typeof this.labelInstanceIdx === 'number') {
      LineV2.labels.setIconColor(this.labelInstanceIdx, colorHex);
    }
  }

  enableDebugging(isVisible: boolean) {
    isVisible;
  }

  get labelIsVisible() {
    return this._labelIsVisible;
  }

  set labelIsVisible(v: boolean) {
    this._labelIsVisible = v;
    this.toggleLabel(v);
  }

  private toggleLabel(isVisible: boolean) {
    if (typeof this.labelInstanceIdx === 'number') {
      LineV2.labels.toggleVisibility(this.labelInstanceIdx, isVisible);
    }
  }

  get labelSize() {
    return this._labelSize;
  }

  set labelSize(v: number) {
    this.settings.labelSize = v;
    this._labelSize = v;
    this.setLabelScale(v);
    this.updateLabel();
  }

  protected setLabelScale(size: number) {
    if (typeof this.labelInstanceIdx === 'number') {
      LineV2.labels.setScale(this.labelInstanceIdx, size);
    }
  }

  get start() {
    return this._start;
  }

  private set start(v: THREE.Vector3) {
    this._start.set(v.x, v.y, v.z);
  }

  setStart(v: THREE.Vector3) {
    this.start = v;

    return this;
  }

  get end() {
    return this._end;
  }

  private set end(v: THREE.Vector3) {
    this._end.set(v.x, v.y, v.z);
  }

  setEnd(v: THREE.Vector3) {
    this.end = v;

    return this;
  }

  get lineWidth() {
    return this.material.linewidth;
  }

  set lineWidth(v: number) {
    this.material.linewidth = v;

    if (this.useInstancedArrows && typeof this.startArrowInstanceIdx === 'number') {
      LineV2.arrows.setScale(this.startArrowInstanceIdx, this.startArrowScale, this.startArrowScale, 0.3);

      return;
    }

    this.startArrowMesh?.scale.set(this.startArrowScale, this.startArrowScale, 0.3);
  }

  get startArrowScale() {
    return Math.max(5, this.lineWidth * 2);
  }

  get endLineWidth() {
    return this.material.endLineWidth;
  }

  set endLineWidth(v: number) {
    this.material.endLineWidth = v;

    if (this.useInstancedArrows && typeof this.endArrowInstanceIdx === 'number') {
      LineV2.arrows.setScale(this.endArrowInstanceIdx, this.endArrowScale, this.endArrowScale, 0.3);

      return;
    }

    this.endArrowMesh?.scale.set(this.endArrowScale, this.endArrowScale, 0.3);
  }

  get endArrowScale() {
    return Math.max(5, this.endLineWidth * 2);
  }

  // Straight lines don't support gradient widths
  setLineWidths(w1: number, w2?: number) {
    this.lineWidth = w1;

    if (this.lineType === 'straight') {
      this.endLineWidth = w1;

      return;
    }

    if (w2) {
      this.endLineWidth = w2;
    }
  }

  // OFFSETS
  // ===========================================
  set gradientOffset(v: number) {
    this.material.gradientOffset = v;
  }

  set visibilityOffset(v: number) {
    const isOffsetPastMidpoint = v > 0.5;

    this.material.visibilityOffset = v;

    if (isOffsetPastMidpoint) {
      this.labelIsVisible && (this.labelIsVisible = false);
    } else {
      !this.labelIsVisible && (this.labelIsVisible = true);
    }

    if (this.hasStartArrow) {
      if (v > 0) {
        this.isStartArrowVisible && (this.isStartArrowVisible = false);
      } else {
        if (this.hasStartArrow && !this.isStartArrowVisible) {
          this.isStartArrowVisible = true;
        }
      }
    }

    if (this.hasEndArrow) {
      if (v > 0.99) {
        this.isEndArrowVisible && (this.isEndArrowVisible = false);
      } else {
        if (this.hasEndArrow && !this.isEndArrowVisible) {
          this.isEndArrowVisible = true;
        }
      }
    }
  }

  get labelInstanceId() {
    return `${this.uuid}-label`;
  }

  get startArrowInstanceId() {
    return `${this.uuid}-start`;
  }

  get endArrowInstanceId() {
    return `${this.uuid}-end`;
  }

  get startArrowPosition() {
    return this._startArrowPosition;
  }

  set startArrowPosition(v: number) {
    this._startArrowPosition = v;
  }

  get endArrowPosition() {
    return this._endArrowPosition;
  }

  set endArrowPosition(v: number) {
    this._endArrowPosition = v;
  }
}
