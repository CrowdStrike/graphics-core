import { GraphicsV2VertexController } from '../vertex';

import type { SlotsConfiguration } from '../vertex-types';

export const UI_OFFSETS = {
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 0)]: {
    x: -6,
    y: -55,
  },
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 1)]: {
    x: 0,
    y: -55,
  },
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 2)]: {
    x: 6,
    y: -55,
  },
  [GraphicsV2VertexController.getLayerSlotName('disposition', 0)]: {
    x: 8,
    y: 8,
  },
  [GraphicsV2VertexController.getLayerSlotName('disposition_background', 0)]: {
    x: 8,
    y: 8,
  },
  [GraphicsV2VertexController.getLayerSlotName('interactions', 0)]: {
    x: 20,
    y: 16,
  },
  [GraphicsV2VertexController.getLayerSlotName('interactions', 1)]: {
    x: 32,
    y: 16,
  },
  [GraphicsV2VertexController.getLayerSlotName('interactions', 2)]: {
    x: 44,
    y: 16,
  },
  [GraphicsV2VertexController.getLayerSlotName('description', 0)]: {
    x: 0,
    y: -40,
  },
  [GraphicsV2VertexController.getLayerSlotName('label', 0)]: {
    x: 0,
    y: -28,
  },
};

export const generateUiSlots = (): SlotsConfiguration[] => {
  return [
    {
      name: 'label',
      instancedAttributeType: 'InstancedTextAttributes',
      scale: 0.72,
      shouldDispatchMouseEvents: true,
      locations: [
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('label', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('label', 0)].y,
          },
        ],
      ],
    },
    {
      name: 'description',
      instancedAttributeType: 'InstancedTextAttributes',
      scale: 0.68,
      shouldDispatchMouseEvents: true,
      locations: [
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('description', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('description', 0)].y,
          },
        ],
      ],
    },
    {
      name: 'badge_below',
      instancedAttributeType: 'InstancedIconAttributes',
      scale: 0.5,
      shouldDispatchMouseEvents: true,
      locations: [
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)].y,
          },
        ],
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)].y,
          },
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 2)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 2)].y,
          },
        ],
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)].x * 2,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)].y,
          },
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)].y,
          },
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 2)].x * 2,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('badge_below', 2)].y,
          },
        ],
      ],
    },
    {
      name: 'disposition_background',
      instancedAttributeType: 'InstancedIconAttributes',
      scale: 0.62,
      locations: [
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].y,
          },
        ],
      ],
    },
    {
      name: 'disposition',
      instancedAttributeType: 'InstancedIconAttributes',
      scale: 0.5,
      locations: [
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].y,
          },
        ],
      ],
    },
    {
      name: 'interaction_plane',
      instancedAttributeType: 'InstancedInteractionAttributes',
      scale: 1.75,
      shouldDispatchMouseEvents: true,
      locations: [[{ x: 0, y: 0 }]],
    },
    {
      name: 'interactions',
      instancedAttributeType: 'InstancedIconAttributes',
      scale: 0.5,
      shouldDispatchMouseEvents: true,
      locations: [
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].y,
          },
        ],
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].y,
          },
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].y,
          },
        ],
        [
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].y,
          },
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].y,
          },
          {
            x: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 2)].x,
            y: UI_OFFSETS[GraphicsV2VertexController.getLayerSlotName('interactions', 2)].y,
          },
        ],
      ],
    },
  ];
};
