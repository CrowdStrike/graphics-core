import { Event } from "../graph-utils-v2/events/event";

export class MouseControlsEvent extends Event {
  static ZOOM_CHANGE = "onZoomChange";
  static ZOOM_COMPLETE = "onZoomComplete";
  percent = 1;

  constructor(type: string) {
    super(type);
  }

  reset() {
    super.reset();
  }
}
