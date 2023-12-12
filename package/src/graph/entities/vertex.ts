import gsap, { Power3 } from 'gsap';

import { TextStyle } from '../../data/TextStyle';
import { InstancedIconAttributes } from '../../entities/instanced-icon-attributes';
import { InstancedInteractionAttributes } from '../../entities/instanced-interaction-attributes';
import {
  InstancedTextAlignment,
  InstancedTextAttributes,
} from '../../entities/instanced-text-attributes';
import { InstancedPositionVector3 } from '../../entities/utils/instanced-position';

import type {
  Coordinates,
  IconCoordinateDictionary,
  LayersConfiguration,
  SlotLocations,
  SlotsConfiguration,
  StateIcon,
  StateInteraction,
  StateText,
  StateVisibility,
  UiLayerAttributeClasses,
} from './vertex-types';

export type InteractionTypes = 'onRollover' | 'onRollout' | 'onClick';

export type InteractionCallbacks<T extends InstancedIconAttributes = InstancedIconAttributes> = {
  [K in Partial<InteractionTypes>]: (e: GraphicsV2VertexController, a: T) => void;
};

export type OverlayState = StateIcon &
  StateInteraction &
  StateText &
  StateVisibility & { interactions?: InteractionCallbacks };

export type OverlayContent = Record<string, OverlayState[]>;

/**
 * Specifies the position, and presentational characteristics
 * of a UI layer.
 */
export type OverlayWithAssignedSlotPosition = OverlayState & {
  attributes: UiLayerAttributeClasses;
  instanceName: string;
  instanceScale: number;
  layerName: string;
  instanceIdx: number;
  positions: Coordinates;
};

export class GraphicsV2VertexController {
  static MULTIPLE_LAYER_SEPARATOR = '@';
  uiLayerSlotMap: Map<string, SlotLocations> = new Map();

  // vertex-specific overrides
  uiLayerSlotMapOverrides: Map<string, SlotLocations> = new Map();

  iconAttributes: InstancedIconAttributes;
  iconCoordinates: IconCoordinateDictionary;

  setIconCoordinates(iconCoordinates: IconCoordinateDictionary) {
    this.iconCoordinates = iconCoordinates;
  }

  static getLayerSlotName(layerName: string, slotNumber: number) {
    return `${layerName}${GraphicsV2VertexController.MULTIPLE_LAYER_SEPARATOR}${slotNumber}`;
  }

  registerUiSlots(layers: SlotsConfiguration[]) {
    layers.forEach((layer) => {
      const { instancedAttributeType, name, scale, locations, shouldDispatchMouseEvents } = layer;

      this.uiLayerSlotMap.set(name, locations);

      for (let layerIdx = 0; layerIdx < layer.locations.length; layerIdx++) {
        // add UI layer with defaults
        this.addUiLayer({
          instancedAttributeType,
          uiConfig: {
            name: GraphicsV2VertexController.getLayerSlotName(name, layerIdx),
            // This will be updated later
            offset: { x: 0, y: 0 },
            scale,
            shouldDispatchMouseEvents: shouldDispatchMouseEvents ?? false,
          },
          iconConfig: {
            maxTextureArraySize: InstancedIconAttributes.MAX_TEXTURE_ARRAY_SIZE,
            textureAtlas: this.iconAttributes?.textureAtlas,
          },
          textConfig: {
            // Adding default text-specific config
            alignment: InstancedTextAlignment.middle,
            truncationLength: 35,
            truncationStrategy: 'end',
            pixelDensity: 3,
          },
        });
      }
    });
  }

  addUiLayer<T extends UiLayerAttributeClasses>(layer: LayersConfiguration): T {
    // if it already exists, do nothing
    try {
      return this.getUiLayer<T>(layer.uiConfig.name);
    } catch {
      const layerAttributes = mapConfigLayerToAttributes<T>(layer);

      if (layerAttributes instanceof InstancedTextAttributes && this.textStyle) {
        layerAttributes.registerTextStyle(this.textStyle);
      }

      this.iconAttributes?.uiLayers.set(layer.uiConfig.name, layerAttributes);

      return layerAttributes;
    }
  }

  getUiLayer<T extends UiLayerAttributeClasses>(name: string): T {
    if (!this.iconAttributes) throw new Error('this.iconAttributes does not exist');

    return this.iconAttributes.getUiLayer<T>(name);
  }

  removeUiLayer(name: string) {
    const attributes = this.uiAttributeMap.get(name);

    if (attributes) {
      attributes.dispose();
      this.uiAttributeMap?.delete(name);

      return attributes.mesh;
    }

    return
  }

  get uiAttributeMap() {
    if (!this.iconAttributes) {
      throw new Error(
        'GraphicsV2VertexController: uiAttributeMap requested but this.iconAttributes does not exist',
      );
    }

    return this.iconAttributes.uiLayers;
  }

  get uiAttributes() {
    return [...(this.uiAttributeMap.values() ?? [])];
  }

  /**
   * TODO Remove all, if any, static members
   */
  static dispose() {
    // TODO
  }

  position: InstancedPositionVector3;

  id: string;

  readonly instanceIdx: number;
  isVisible = true;

  // state stuff
  _baseSize = 24;
  zoomPercent = 1;
  state: StateIcon = {
    icon: '',
    color: 0xffffff,
  };

  visibilityOverrides: Map<string, boolean> = new Map();

  interactions: Map<string, InteractionCallbacks> = new Map();

  textStyle: TextStyle;

  // TODO use this in future for optimizations
  //
  // if overlay state is dirty we should re-compute state config
  // do UI overlays need to be re-computed? (position etc)
  private isOverlayStateDirty = true;

  overlayContent: OverlayContent = {};

  constructor({
    id,
    icon,
    size,
    color,
    overlays,
    iconAttributes,
    iconCoordinates,
    slots,
    textStyle,
  }: {
    id: string;
    icon: string;
    size: number;
    color?: number;
    overlays: OverlayContent;
    iconAttributes: InstancedIconAttributes;
    iconCoordinates: IconCoordinateDictionary;
    slots: SlotsConfiguration[];
    textStyle?: TextStyle;
  }) {
    this.id = id;
    this.iconAttributes = iconAttributes;
    this.iconCoordinates = iconCoordinates;
    this.iconAttributes.shouldDispatchMouseEvents = true;
    this.textStyle = textStyle ?? new TextStyle();

    this.registerUiSlots(slots);

    this.instanceIdx = this.iconAttributes.add({ id });

    this.position = new InstancedPositionVector3({
      x: 0,
      y: 0,
      z: 0,
      id: this.id,
      /**
       * doing this.position.set() will
       * recursively set the position of the base icon and all overlays
       */
      attributes: this.iconAttributes,
      entity: this
    });

    this.uiAttributes.forEach((d) => {
      d.add({ id });
    });

    this.setBaseIconFromName(icon);
    this.setBaseIconColor(color ?? 0xffffff);

    this.baseSize = size;

    // sets this.overlayContent (and by extension) this.overlays
    this.updateOverlayContent(overlays);

    this.update();
  }

  runInteractionsFor(layerName: string, interactionKey: InteractionTypes) {
    let interactionCallback = this.interactions.get(layerName);

    if (interactionCallback?.[interactionKey] !== undefined) {
      interactionCallback[interactionKey](
        this,
        this.getUiLayer<InstancedIconAttributes>(layerName),
      );
    }
  }

  get attributesToHide() {
    // make a copy so that this.getUiLayerPositions doesn't get re-computed below
    const overlaysWithCoordinates = this.overlays;

    return this.uiAttributes.filter(
      (a) => !overlaysWithCoordinates.map((a) => a.attributes).includes(a),
    );
  }

  get attributesToShow() {
    // make a copy so that this.getUiLayerPositions doesn't get recomputed below
    const overlaysWithCoordinates = this.overlays;

    return this.uiAttributes.filter((a) =>
      overlaysWithCoordinates.map((a) => a.attributes).includes(a),
    );
  }

  /**
   * This disposes of the current instance
   */
  dispose() {
    this.iconAttributes?.remove({ id: this.id });
  }

  /**
   * TODO This should ideally be memoized
   * otherwise, everytime we do this.overlays,
   * this.getUiLayerPositions would need to be re-computed
   *
   * Maybe we can use this.isOverlayStateDirty here?
   */
  get overlays(): OverlayWithAssignedSlotPosition[] {
    if (this.overlayContent) {
      return this.getUiLayerPositions(this.overlayContent);
    } else {
      return [];
    }
  }

  /**
   * Gets positions for each UI element for this particular vertex
   */
  private getUiLayerPositions(layers: OverlayContent): OverlayWithAssignedSlotPosition[] {
    const out = [] as OverlayWithAssignedSlotPosition[];

    [...this.uiLayerSlotMap.keys()].forEach((layerName) => {
      const uiElementsToAdd = layers[layerName];
      let slots: SlotLocations | undefined;

      // we may want to override positional slots for an individual vertex
      // so that they depend on interactions
      if (this.uiLayerSlotMapOverrides.size && this.uiLayerSlotMapOverrides.get(layerName)) {
        slots = this.uiLayerSlotMapOverrides.get(layerName);
      } else {
        slots = this.uiLayerSlotMap.get(layerName);
      }

      if (!uiElementsToAdd || !slots) return;

      const positions = slots[uiElementsToAdd.length - 1];

      uiElementsToAdd.forEach((element, idx) => {
        const { icon, color, ringColor, text, interactions } = element;
        const instanceName = GraphicsV2VertexController.getLayerSlotName(layerName, idx);
        const { instanceIdx } = this;

        const attributes = this.getUiLayer(instanceName);

        out.push({
          attributes,
          instanceName,
          instanceScale: attributes.uiConfig?.scale ?? 0.5,
          layerName,
          instanceIdx,
          interactions, // TODO will this duplicate callbacks? if so, bad for perf
          icon: icon ?? undefined,
          color,
          ringColor,
          positions: { x: positions[idx].x, y: positions[idx].y },
          text,
        });
      });
    });

    return out;
  }

  // TODO Make a complementary method called setBaseIconFromCoordinates
  setBaseIconFromName(icon: string) {
    if (!this.iconCoordinates) {
      throw new Error(
        'GraphicsV2VertexController: iconCoordinates does not exist. Add one using the GraphicsV2VertexController.initializeIconAttributes static method',
      );
    }

    if (!this.iconCoordinates[icon]) {
      throw new Error(`this.iconCoordinates: ${icon} entry doesn't exist`);
    }

    let { x, y, w, h, width, height } = this.iconCoordinates[icon];

    this.iconAttributes?.changeIcon(this.instanceIdx, width, height, [x, y, w, h]);
    this.state.icon = icon;
  }

  setBaseIconColor(color: number) {
    this.iconAttributes?.setIconColor(this.instanceIdx, color);
    this.state.color = color;
  }

  /**
   * This sets state for each UI layer. State includes:
   *    - relative scale and position offset
   *    - color
   *    - icon name
   *    - interaction-specific attributes
   */
  private setConfigForLayers() {
    this.overlays.forEach((layer) => {
      const { instanceName, instanceScale, instanceIdx, icon, positions, color, ringColor } = layer;
      const attributes = this.getUiLayer<InstancedIconAttributes>(instanceName);

      if (attributes instanceof InstancedIconAttributes && icon) {
        // TODO: should we be passing coordinates here directly instead?
        if (this.iconCoordinates[icon]) {
          let { x, y, w, h, width, height } = this.iconCoordinates[icon];

          attributes.changeIcon(instanceIdx, width, height, [x, y, w, h]);
        }
      }

      if (attributes instanceof InstancedInteractionAttributes) {
        color && attributes.setColorAt(instanceIdx, color);
        ringColor && attributes.setRingColorAt(instanceIdx, ringColor);
      }

      if (attributes.updateConfig) {
        attributes?.updateConfig({
          name: instanceName,
          scale: instanceScale,
          offset: {
            x: positions.x,
            y: positions.y,
          },
        });
      }

      if (attributes.setIconColor) {
        color && attributes.setIconColor(instanceIdx, color);
      }

      if (attributes instanceof InstancedTextAttributes) {
        // this gives us the ability to have different text styles between
        // entities:
        // - fontName
        // - fontColor
        // could be changed here
        attributes.updateTextAt(instanceIdx, layer.text ?? '');
      }
    });

    // this.isOverlayStateDirty = false;
  }

  /**
   * Used for adding
   */
  addUiSlotOverride(layerName: string, positions: SlotLocations) {
    // only add the override if the corresponding layer exists
    if (this.uiLayerSlotMap.has(layerName)) {
      this.uiLayerSlotMapOverrides.set(layerName, positions);
    }
  }

  // TODO we should return the gsap.to so we can chain animations
  // This is temporarily removed for now because it was giving us build issues
  animateUiSlotsTo(layerName: string, positions: SlotLocations, duration = 0.5) {
    // this will use this.addUiSlotOverride()
    if (!this.uiLayerSlotMap.has(layerName)) {
      throw new Error("animateUiSlotsTo: requested layer doesn't exist");
    }

    let positionsToAnimate = this.uiLayerSlotMapOverrides.has(layerName)
      ? this.uiLayerSlotMapOverrides.get(layerName)
      : this.uiLayerSlotMap.get(layerName);

    if (!positionsToAnimate) return;

    // copy to slot overrides
    this.uiLayerSlotMapOverrides.set(layerName, positionsToAnimate);

    // make both into flat arrays of [x, y, x, y, x, y]
    const sourcePositions = positionsToAnimate?.flatMap((p) => p).flatMap((p) => [p.x, p.y]);
    const targetPositions = positions.flatMap((p) => p).flatMap((p) => [p.x, p.y]);

    gsap.to(
      { positions: sourcePositions },
      {
        positions: targetPositions,
        overwrite: true,
        duration,

        ease: Power3.easeInOut,
        onUpdate(context: GraphicsV2VertexController, positionsToAnimate: SlotLocations) {
          // GSAP for some reason serializes number arrays into comma-delimited strings,
          // or number arrays so we have to de-serialize them accoring to their type
          let interpolatedPositions: string | number[] = this['targets']()[0].positions;

          if (typeof interpolatedPositions === 'string') {
            interpolatedPositions = interpolatedPositions.split(',').map((d) => parseFloat(d));
          }

          const out: Coordinates[] = [];

          for (let i = 0; i < interpolatedPositions.length; i += 2) {
            out.push({
              x: interpolatedPositions[i],
              y: interpolatedPositions[i + 1],
            });
          }

          context.uiLayerSlotMapOverrides.set(
            layerName,
            // re-assemble in the form [ [0], [1, 2], [3, 4, 5] ]
            // we only need positionsToAnimate as reference for how many slots
            // we need to allocate positions to
            positionsToAnimate.map((_, i) => {
              return out.splice(0, i + 1);
            }),
          );

          // we're manipulating UI layer positional overrides,
          // therefore isOverlayStateDirty needs to be set, so that position
          // can be set accurately
          context.isOverlayStateDirty = true;
          context.update();
        },
        onUpdateParams: [this, positionsToAnimate],
      },
    );
  }

  removeUiSlotOverride(layerName: string) {
    this.uiLayerSlotMapOverrides.delete(layerName);
  }

  private setScale(scalar: number) {
    this.iconAttributes.setScale(this.instanceIdx, scalar);
  }

  setZoom(zoomPercent: number) {
    this.zoomPercent = zoomPercent;

    // this will set .zoomPercent on all sub-layers,
    // so that this.setScale (when done recursively) need not be
    // multiplied by zoomPercent
    this.iconAttributes.setZoomAt(this.instanceIdx, this.zoomPercent);
    this.update();
  }

  update() {
    if (this.isOverlayStateDirty) {
      this.setConfigForLayers();
      // this.isOverlayStateDirty = false;
    }

    // this.setScale(this.baseSize * this.zoomPercent);
    this.setScale(this.baseSize);
  }

  /**
   * Updates the base icon state
   */
  updateState(state: StateIcon = {}) {
    if (state.icon) {
      this.setBaseIconFromName(state.icon);
    }

    if (state.color) {
      this.setBaseIconColor(state.color);
    }
  }

  /**
   * Updates the state for a named overlay
   */
  updateOverlayState(name: string, state: Partial<OverlayState>, idx = 0) {
    if (!this.overlayContent?.[name]) return;

    if (this.overlayContent[name][idx]) {
      this.overlayContent[name][idx] = { ...this.overlayContent[name][idx], ...state };
    }

    if (state.isVisible !== undefined) {
      this.setVisibilityForLayer(
        GraphicsV2VertexController.getLayerSlotName(name, idx),
        state.isVisible,
      );
    }
  }

  /**
   * Updates the content for all overlays, and diffs the new ones
   * with the previous ones in order to decide which need to be visible or not
   */
  updateOverlayContent(newOverlayContent: OverlayContent) {
    this.overlayContent = newOverlayContent;
    this.attributesToHide.forEach((a) => a.setDisplayAt(this.instanceIdx, false));
    this.attributesToShow.forEach((a) => a.setDisplayAt(this.instanceIdx, true));

    // This is needed to make the updated
    // overlays consistent with the visibility of the vertex.
    if (!this.isVisible) {
      this.setVisibility(this.isVisible);
    }

    // interaction callbacks should always be kept in sync with the number of
    // requested slots
    this.updateLayerInteractions();

    this.isOverlayStateDirty = true;
  }

  private updateLayerInteractions() {
    const layersWithInteractions = this.overlays.reduce<[string, InteractionCallbacks][]>(
      (acc, curr) => {
        const { instanceName, interactions } = curr;

        if (interactions) {
          acc.push([instanceName, interactions]);
        }

        return acc;
      },
      [],
    );

    if (layersWithInteractions.length > 0) {
      this.interactions.clear();
      layersWithInteractions.forEach(([key, value]) => {
        this.interactions.set(key, value);
      });
    }
  }

  get baseSize() {
    return this._baseSize;
  }

  set baseSize(s: number) {
    this._baseSize = s;
    this.setScale(s);
  }

  setVisibility(isVisible: boolean) {
    this.overlays.forEach(({ attributes, instanceName }) => {
      // we don't care about applying the overrides when not visible
      if (isVisible && this.visibilityOverrides.has(instanceName)) {
        // if the key exists, respect the visibility override
        const visibilityOverride = this.visibilityOverrides.get(instanceName);

        visibilityOverride !== undefined &&
          attributes.setDisplayAt(this.instanceIdx, visibilityOverride);
      } else {
        attributes.setDisplayAt(this.instanceIdx, isVisible);
      }
    });

    this.iconAttributes.setDisplayAt(this.instanceIdx, isVisible);
    this.isVisible = isVisible;
  }

  private setVisibilityForLayer(layerName: string, isVisible: boolean) {
    try {
      // this throws if the layer doesn't exist
      this.getUiLayer(layerName);
      this.visibilityOverrides.set(layerName, isVisible);
      this.setVisibility(this.isVisible);
    } catch (e) {e;}
  }

  get width() {
    return this.baseSize * this.zoomPercent;
  }

  get height() {
    return this.baseSize * this.zoomPercent;
  }
}

function mapConfigLayerToAttributes<T extends UiLayerAttributeClasses>(
  config: LayersConfiguration,
): T {
  switch (config.instancedAttributeType) {
    case 'InstancedIconAttributes':
      return new InstancedIconAttributes(config.iconConfig ?? {}, config.uiConfig) as T;
    case 'InstancedTextAttributes':
      if (config.textConfig) {
        return new InstancedTextAttributes(config.textConfig, config.uiConfig) as T;
      }

      throw new Error(
        'mapConfigLayerToAttributes: no textConfig exists for specified InstancedTextAttributes layer',
      );
    case 'InstancedInteractionAttributes':
      return new InstancedInteractionAttributes({ size: 1 }, config.uiConfig) as T;
    default:
      throw new Error(
        'mapConfigLayerToAttributes: LayerConfiguration instancedAttributeType not supported',
      );
  }
}
