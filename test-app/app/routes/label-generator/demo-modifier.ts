/**
 * TODO Increasing pixelDensity misaligns the label textures.
 * TODO LabelGenerator has a problem where,
 * if there aren't enough characters,
 * "Vertex buffer is not big enough for the draw call"
 * TODO Are there too many LabelMesh objects created?
 *
 * This demo generates N strings and renders them to offscreen textures.
 * It is meant to demonstrate the capabilities of the InstancedMultiUvMaterial
 * and shader, which will sample an appropriate from an array of textures.
 */

import { registerDestructor } from '@ember/destroyable';

import {
  GL_MAX_TEXTURE_IMAGE_UNITS,
  InstancedMultiUvMaterial,
  LabelGenerator,
  NumberUtils ,
  setupScene,
  TextGenerator,
  TextStyle,
} from '@crowdstrike/graphics-core';
import Modifier from 'ember-modifier';
import * as THREE from 'three';

import type { DynamicSpriteSheetGenerator, NormalizedBbox } from '@crowdstrike/graphics-core';
import type ApplicationInstance from '@ember/application/instance';

interface Args {
  named: never;
  positional: never;
}

type LabelMap = Map<
  string,
  {
    bbox: NormalizedBbox;
    idx: number;
    text: string;
    textureId: string;
    textureIdx: number;
  }
>;

export class LabelGeneratorModifier extends Modifier<Args> {
  raf?: number;
  renderer?: THREE.WebGLRenderer;
  textSpriteSheetGenerator: DynamicSpriteSheetGenerator;
  textGenerator: TextGenerator;

  constructor(owner: ApplicationInstance, args: Args) {
    super(owner, args);

    this.textGenerator = new TextGenerator(2048, 2048);
    this.textSpriteSheetGenerator = TextGenerator.getSpriteSheetGenerator();

    registerDestructor(this, () => this.cleanup());
  }

  modify(element: HTMLElement) {
    const style = new TextStyle();

    style.name = 'style-name';
    style.fontColor = 0xf5fc2b;
    // style.fontSize = 75;
    style.pixelDensity = 2;
    style.alignment = TextStyle.ALIGN_CENTER;
    style.fontName = 'Helvetica Neue';
    style.backgroundColor = 0xff0000;

    const bbox = new THREE.Box3();
    const v3 = new THREE.Vector3();

    const STRINGS_TO_RENDER = 200;
    let stringsToRender = STRINGS_TO_RENDER;

    const labelMap: LabelMap = new Map();
    const generatedStrings: string[] = [];
    const canvasTextures: THREE.Texture[] = [];

    while (stringsToRender--) {
      let t =
        this.textSpriteSheetGenerator.textureCount -
        1 +
        '-' +
        NumberUtils.generateUUID().substring(0, NumberUtils.getRandomInt(4, 20));

      generatedStrings.push(t);
      style.fontSize = NumberUtils.getRandomInt(24, 100);

      const label = LabelGenerator.make(t, style);

      label.scale.set(0.25, 0.25, 0.25);
      label.material.transparent = true;

      // Keep track of which DynamicSpriteSheet each label has been rendered on (textureIdx).
      // This is tricky to do right, because a particular string may be cached,
      // and situated in a DynamicSpriteSheet which is not the latest one.
      // Therefore, we have to encode it inside label.userData, in TextGenerator.
      labelMap.set(t, {
        bbox: label.textGenerator?._spriteRegionData?.normalizedCoordinates || [0, 0, 1, 1],
        text: t,
        textureId: this.textSpriteSheetGenerator?.currentSpriteSheet.id,
        textureIdx: label.spriteSheetIdx ?? -1,
        idx: stringsToRender,
      });
    }

    // TextGenerator?._spriteSheetGenerator?.spriteSheets.forEach((d) => {
    //   if (d.canvas) {
    //     document.body.insertBefore(d.canvas, document.body.firstChild);
    //   }
    // });

    const generatedLabelsArray = [...labelMap.values()].sort((a, b) => a.idx - b.idx);

    TextGenerator._spriteSheetGenerator?.freeze();

    const { container, stats, camera, renderer, controls, threeJsView } = setupScene(element);

    controls.maxDistance = 4000;
    controls.minDistance = 500;

    this.renderer = renderer;

    const textTextures = this.textSpriteSheetGenerator.textures;

    // Only push the maximum allowed number of textures.
    if (textTextures) {
      for (let i = 0; i < textTextures.length; i++) {
        if (i >= GL_MAX_TEXTURE_IMAGE_UNITS) {
          throw new Error(
            `InstancedMultiUvMaterialShader: more textures generated (${textTextures.length}) than are supported by the WebGL2 shader's texture array (${GL_MAX_TEXTURE_IMAGE_UNITS})`
          );
        } else {
          canvasTextures.push(textTextures[i] as THREE.Texture);
        }
      }
    }

    const geometry = new THREE.PlaneGeometry(128, 128);
    const material = new InstancedMultiUvMaterial({
      map: canvasTextures[0],
      alphaTest: 0.1,
      transparent: true,
      defines: {
        USE_DEBUG_BOUNDS: true,
        USE_SAMPLED_COLOR: true,
      },
    });

    material.texArray = canvasTextures;
    material.numTextures = canvasTextures.length;
    material.needsUpdate = true;

    // Specify to the shader which regions of the texture to sample for each label instance.
    geometry.attributes['uvOffset'] = new THREE.InstancedBufferAttribute(
      new Float32Array(generatedLabelsArray.flatMap((l) => l.bbox)),
      4
    );
    geometry.attributes['uvOffset'].needsUpdate = true;

    geometry.attributes['instanceColor'] = new THREE.InstancedBufferAttribute(
      new Float32Array(
        Array(STRINGS_TO_RENDER * 3)
          .fill(0)
          .flatMap(() => [1, 1, 1])
      ),
      3
    );
    geometry.attributes['instanceColor'].needsUpdate = true;

    geometry.attributes['instanceOpacity'] = new THREE.InstancedBufferAttribute(
      new Float32Array(
        Array(STRINGS_TO_RENDER)
          .fill(1)
          .map(() => NumberUtils.random(0.4, 1))
      ),
      1
    );
    geometry.attributes['instanceOpacity'].needsUpdate = true;

    geometry.attributes['instanceDisplay'] = new THREE.InstancedBufferAttribute(
      new Float32Array(Array(STRINGS_TO_RENDER).fill(1)),
      1
    );
    geometry.attributes['instanceDisplay'].needsUpdate = true;

    geometry.attributes['texIdx'] = new THREE.InstancedBufferAttribute(
      new Float32Array(
        // Get texture array index of relevant dynamic sprite sheet generator
        generatedLabelsArray.flatMap((l) => {
          return l.textureIdx;
        })
      ),
      1
    );
    geometry.attributes['texIdx'].needsUpdate = true;

    const mesh = new THREE.InstancedMesh(geometry, material, STRINGS_TO_RENDER);

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(1, 1);

    function onMouseMove(event: MouseEvent) {
      event.preventDefault();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    document.addEventListener('mousemove', onMouseMove);

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const tmpVec = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < generatedLabelsArray.length; i++) {
      quaternion.setFromAxisAngle(tmpVec.set(0, 1, 0), Math.PI / 4);
      tmpVec.applyQuaternion(quaternion);
      tmpVec.sub(position);
      tmpVec.applyQuaternion(quaternion);
      tmpVec.add(position);

      quaternion.setFromEuler(rotation);

      const coords = generatedLabelsArray[i]?.bbox;

      if (!coords) continue;

      const [, , w, h] = coords;

      position.x = geometry.parameters.width * 1.1 * (i / 10);
      position.y = geometry.parameters.height * (i % 15);
      position.z = 100;

      v3.copy(position);
      bbox.expandByPoint(v3);

      scale.x = 1;

      if (h > w) {
        scale.x = w / h;
      }

      scale.y = 1;

      if (h < w) {
        scale.y = h / w;
      }

      scale.z = 1;

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    container.add(mesh);

    // center the mesh
    mesh.position.x -= (bbox.max.x - bbox.min.x) / 2;
    mesh.position.y -= (bbox.max.y - bbox.min.y) / 2;

    renderer.setClearColor(0x590352);

    const animate = () => {
      this.raf = requestAnimationFrame(animate);
      controls.update();
      stats.update();

      raycaster.setFromCamera(mouse, camera);

      const intersection = raycaster.intersectObject(mesh);

      // Used for debugging:
      // Cycles through the texture indices, in order to debug off-by-one errors.
      if (intersection.length > 0) {
        const o: THREE.Intersection<THREE.InstancedMesh> =
          intersection[0] as THREE.Intersection<THREE.InstancedMesh>;
        const { instanceId } = o;

        if (renderer.info.render.frame % 60 === 0 && !!instanceId) {
          const texIdx = geometry.getAttribute('texIdx').getX(instanceId);

          geometry
            .getAttribute('texIdx')
            .setX(instanceId, (texIdx + 1) % this.textSpriteSheetGenerator.textureCount);

          geometry.getAttribute('texIdx').needsUpdate = true;
        }
      }

      threeJsView.render();
    };

    animate();
  }

  cleanup() {
    this.renderer?.dispose();
    this.raf && cancelAnimationFrame(this.raf);

    // gets rid of the static DynamicSpriteSheetGenerator
    this.textGenerator.dispose();

    // recreate the static DynamicSpriteSheetGenerator with the first canvas
    TextGenerator.getSpriteSheetGenerator().requestRegion(2048, 2048);
  }
}
