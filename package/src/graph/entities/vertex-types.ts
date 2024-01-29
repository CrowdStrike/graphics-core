import type { UiBadgeConfiguration } from '../../entities/instanced-attributes';
import type { InstancedIconAttributes, InstancedIconConfiguration } from '../../entities/instanced-icon-attributes';
import type { InstancedInteractionAttributes } from '../../entities/instanced-interaction-attributes';
import type { InstancedTextAttributes, InstancedTextConfiguration } from '../../entities/instanced-text-attributes';
import type { InstancedAttributeTypes } from '../../entities/utils/instanced-attribute-types';

export type UiLayerAttributeClasses =
  | InstancedIconAttributes
  | InstancedTextAttributes
  | InstancedInteractionAttributes;

export interface LayersConfiguration {
  instancedAttributeType: InstancedAttributeTypes;
  uiConfig: UiBadgeConfiguration;
  iconConfig?: InstancedIconConfiguration;
  textConfig?: InstancedTextConfiguration;
}

export interface Coordinates {
  x: number;
  y: number;
}

export type SlotLocations = Coordinates[][];

export type IconCoordinates = Coordinates & {
  w: number;
  h: number;
  width: number;
  height: number;
};

export interface SlotsConfiguration {
  name: string;
  instancedAttributeType: InstancedAttributeTypes;
  scale: number;
  shouldDispatchMouseEvents?: boolean;
  locations: SlotLocations;
}

export interface StateIcon {
  color?: number;
  icon?: string;
}

export interface StateInteraction {
  color?: number;
  ringColor?: number;
}

export interface StateText {
  text?: string;
}

export interface StateVisibility {
  isVisible?: boolean;
}

export type IconCoordinateDictionary = Record<string, IconCoordinates>;
