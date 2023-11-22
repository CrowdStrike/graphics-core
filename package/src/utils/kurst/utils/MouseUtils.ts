export class MouseUtils {
  static rollover(el?: HTMLElement) {
    if (el) {
      el.style.cursor = 'pointer';

      return;
    }

    document.body.style.cursor = 'pointer';
  }

  static rollout(el?: HTMLElement) {
    if (el) {
      el.style.cursor = 'default';

      return;
    }

    document.body.style.cursor = 'default';
  }
}
