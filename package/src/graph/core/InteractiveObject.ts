import { RenderableObject } from './RenderableObject';

import type { ThreeJSView } from '../../core/ThreeJSView';
import type { MousePickerEvents } from '../../events/MousePickerEvents';

interface InteractiveObjectParams {
  threeView: ThreeJSView;
}

export class InteractiveObject extends RenderableObject {
  constructor({ threeView }: InteractiveObjectParams) {
    super({ threeView });
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  // optional overrides to implement in parent classes

  onStartDrag(_event: MousePickerEvents) {}

  onStopDrag(_event: MousePickerEvents) {}

  onCanvasMouseDown(_event: MousePickerEvents) {}

  onCanvasMouseUp(_event: MousePickerEvents) {}

  onCanvasMouseOut(_event: MousePickerEvents) {}

  onCanvasMouseOver(_event: MousePickerEvents) {}

  onMouseDown(_event: MousePickerEvents) {}

  onMouseUp(_event: MousePickerEvents) {}

  onMouseWheel(_event: MousePickerEvents) {}

  onRollOut(_event: MousePickerEvents) {}

  onRollOver(_event: MousePickerEvents) {}

  startDragObject(_event: MousePickerEvents) {}

  stopDragObject(_event: MousePickerEvents) {}

  onDragObject(_event: MousePickerEvents) {}

  onDoubleClick(_event: MousePickerEvents) {}

  /* eslint-enable @typescript-eslint/no-empty-function */
}
