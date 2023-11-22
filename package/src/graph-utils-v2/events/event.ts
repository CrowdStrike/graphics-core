export class Event {
  public type: string;
  public target: unknown;

  public static readonly COMPLETE = 'complete';
  public static readonly OPEN = 'open';
  public static readonly ENTER_FRAME = 'enterFrame';
  public static readonly EXIT_FRAME = 'exitFrame';
  public static readonly RESIZE = 'resize';
  public static readonly ERROR = 'error';
  public static readonly CHANGE = 'change';

  constructor(type: string) {
    this.type = type;
  }

  clone(): Event {
    return new Event(this.type);
  }

  reset(): void {
    this.target = undefined;
  }
}
