export class FocusManager {
  isFocused = false;
  private _isActive = false;
  private _htmlElement?: HTMLElement;
  private _focusEventDelegate: (e: FocusEvent) => void;
  private _blurEventDelegate: (e: FocusEvent) => void;
  private _accessibilityElement?: HTMLElement;
  private _accessibilityJsSelector?: string;
  private _windowClickEventDelegate: (e: MouseEvent) => void;

  constructor({ htmlElement }: { htmlElement: HTMLElement }) {
    this._htmlElement = htmlElement;
    this._htmlElement?.setAttribute('tabindex', '0');
    this._focusEventDelegate = (e: FocusEvent) => this._onFocus(e);
    this._blurEventDelegate = (e: FocusEvent) => this._onBlur(e);
    this._windowClickEventDelegate = (e: MouseEvent) => this._onClickWindow(e);
    window.addEventListener('click', this._windowClickEventDelegate);

    this._htmlElement?.addEventListener('focus', this._focusEventDelegate);
    this._htmlElement?.addEventListener('blur', this._blurEventDelegate);
  }

  dispose() {
    window.removeEventListener('click', this._windowClickEventDelegate);
    this._htmlElement?.removeEventListener('focus', this._focusEventDelegate);
    this._htmlElement?.removeEventListener('blur', this._blurEventDelegate);
    this._htmlElement = undefined;

    if (this._accessibilityElement) {
      this._accessibilityElement.removeEventListener('blur', this._blurEventDelegate);
      this._accessibilityElement = undefined;
    }
  }

  willUpdateFocusState({ isFocused }: { isFocused: boolean }) {
    this.isFocused = isFocused;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  didUpdateActiveState() {} // Do not delete - this is part of the FocusManager interface.

  private _onFocus(_: FocusEvent) {
    this.willUpdateFocusState({ isFocused: true });
    this.isActive = true;
  }

  private _onClickWindow(e: MouseEvent) {
    let isActive = e.target === this._htmlElement;

    // pressing space / enter on a button triggers a window click event
    // we want to ignore these for the A11Y layer
    let jsSelector = this.accessibilityJsSelector;
    let { target } = e;
    let isAccessible = target && (target as HTMLElement).dataset['jsSelector'] === jsSelector;

    if (isAccessible && jsSelector) {
      isActive = true;
    }

    if (this.isActive !== isActive) {
      this.isActive = isActive;
    }

    if (this.isFocused !== isActive) {
      this.willUpdateFocusState({ isFocused: isActive });
    }
  }

  private _onBlur(e: FocusEvent) {
    let { relatedTarget } = e;
    let jsSelector = this.accessibilityJsSelector;
    let isAccessible =
      relatedTarget && (relatedTarget as HTMLElement).dataset['jsSelector'] === jsSelector;

    if (isAccessible && jsSelector) {
      return;
    }

    this.willUpdateFocusState({ isFocused: false });
    this.isActive = false;
  }

  get accessibilityJsSelector() {
    return this._accessibilityJsSelector;
  }

  set accessibilityJsSelector(str) {
    this._accessibilityJsSelector = str;
  }

  get isActive() {
    return this._isActive;
  }

  set isActive(bool) {
    this._isActive = bool;
    this.didUpdateActiveState();
  }
}
