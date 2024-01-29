import { GraphicsV2VertexController } from '../vertex';

import type { Coordinates, SlotsConfiguration } from '../vertex-types';

export const DEFAULT_UI_OFFSETS = {
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 0)]: {
    x: 0,
    y: -59,
  },
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 1)]: {
    x: 12,
    y: -59,
  },
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 2)]: {
    x: 24,
    y: -59,
  },
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 3)]: {
    x: 36,
    y: -59,
  },
  [GraphicsV2VertexController.getLayerSlotName('badge_below', 4)]: {
    x: 48,
    y: -59,
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
    y: -44,
  },
  [GraphicsV2VertexController.getLayerSlotName('label', 0)]: {
    x: 0,
    y: -28,
  },
};

export const generateHorizontalUiSlots = (shouldShowDescription = true): SlotsConfiguration[] => {
  const layerOffsets = { ...DEFAULT_UI_OFFSETS };

  layerOffsets[GraphicsV2VertexController.getLayerSlotName('label', 0)] = {
    x: 18,
    y: shouldShowDescription ? 23 : 12,
  };
  layerOffsets[GraphicsV2VertexController.getLayerSlotName('description', 0)] = {
    x: 18,
    y: 12,
  };

  const slots = generateVerticalUiSlots(layerOffsets);

  const badgeBelowSlotConfigIdx = slots.map((s) => s.name).indexOf('badge_below');

  slots[badgeBelowSlotConfigIdx].locations = slots[badgeBelowSlotConfigIdx].locations.map((l, idx) =>
    startFromPoint(l, { x: 24, y: shouldShowDescription ? 34 : 23 }, idx + 1),
  );

  return slots;
};

const centerAlignNamedSlotLayers = (slotLayers: Coordinates[], alignOn: 'x' | 'y' = 'x'): Coordinates[] => {
  // assumes ordered layers
  const translateEach = (slotLayers[slotLayers.length - 1][alignOn] - slotLayers[0][alignOn]) / 2;

  return slotLayers.map((l) => ({ ...l, [alignOn]: l[alignOn] - translateEach }));
};

const startFromPoint = (
  slotLayers: Coordinates[],
  point: Coordinates,
  amount = 1,
  spacing = 12,
  expandOn: 'x' | 'y' = 'x',
): Coordinates[] => {
  const out = [];
  const constantCoordinate = expandOn === 'x' ? 'y' : 'x';

  for (let i = 0; i < amount; i++) {
    out.push({
      ...slotLayers[i],
      [constantCoordinate]: point[constantCoordinate],
      [expandOn]: point[expandOn] + i * spacing,
    });
  }

  return out;
};

export const generateVerticalUiSlots = (layerOffsets = DEFAULT_UI_OFFSETS): SlotsConfiguration[] => {
  return [
    {
      name: 'label',
      instancedAttributeType: 'InstancedTextAttributes',
      scale: 0.72,
      shouldDispatchMouseEvents: true,
      locations: [
        [
          {
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('label', 0)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('label', 0)].y,
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
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('description', 0)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('description', 0)].y,
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
        centerAlignNamedSlotLayers([layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)]], 'x'),
        centerAlignNamedSlotLayers(
          [
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)],
          ],
          'x',
        ),
        centerAlignNamedSlotLayers(
          [
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 2)],
          ],
          'x',
        ),
        centerAlignNamedSlotLayers(
          [
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 2)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 3)],
          ],
          'x',
        ),
        centerAlignNamedSlotLayers(
          [
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 0)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 1)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 2)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 3)],
            layerOffsets[GraphicsV2VertexController.getLayerSlotName('badge_below', 4)],
          ],
          'x',
        ),
      ],
    },
    {
      name: 'disposition_background',
      instancedAttributeType: 'InstancedIconAttributes',
      scale: 0.62,
      locations: [
        [
          {
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].y,
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
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('disposition', 0)].y,
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
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].y,
          },
        ],
        [
          {
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].y,
          },
          {
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].y,
          },
        ],
        [
          {
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 0)].y,
          },
          {
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 1)].y,
          },
          {
            x: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 2)].x,
            y: layerOffsets[GraphicsV2VertexController.getLayerSlotName('interactions', 2)].y,
          },
        ],
      ],
    },
  ];
};
