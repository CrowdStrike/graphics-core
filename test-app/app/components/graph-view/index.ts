import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { guidFor } from '@ember/object/internals';
import { later, schedule } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

import { modifier } from 'ember-modifier';
import { getAppConfig } from 'test-app-for-graphics-core/utils/app-config';
import { EmberComponentInterfaceEvents } from 'test-app-for-graphics-core/utils/ember-component-interface-events';

import type ThemeManager from '@crowdstrike/ember-toucan-styles/services/theme-manager';
import type ApplicationInstance from '@ember/application/instance';
import type GraphViewService from 'test-app-for-graphics-core/services/graph-view';
import type { GraphConfigurationActions } from 'test-app-for-graphics-core/utils/graph-view-configuration';
import type GraphViewConfiguration from 'test-app-for-graphics-core/utils/graph-view-configuration';
import type { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';

interface Args {
  graphConfiguration: GraphViewConfiguration;
  canvasClasses?: string;
}

function graphViewSettings<TData>(
  eci: GraphViewConfiguration<TData>,
  container: FalconGraphViewComponent,
) {
  let { rootURL } = getAppConfig(container);

  if (eci.viewSettings) {
    eci.viewSettings.rootURL = rootURL;
  }

  return eci;
}

export default class FalconGraphViewComponent extends Component<Args> {
  @service declare graphView: GraphViewService;
  @service declare themeManager: ThemeManager;

  id?: string;
  domElement?: HTMLElement;
  @tracked threeJsComponent?: ThreeJsComponentInterface;
  isActive = true;
  resizeEventDelegate = () => this.handleResized();
  resizeObserver?: ResizeObserver;
  onMouseEnterRef = this.onMouseEnter.bind(this);
  onMouseLeaveRef = this.onMouseLeave.bind(this);
  canvas?: HTMLCanvasElement;

  constructor(owner: ApplicationInstance, args: Args) {
    super(owner, args);
    window.addEventListener('resize', this.resizeEventDelegate);
  }

  dispose() {
    this.graphView.removeView(this.assetId);
    window.removeEventListener('resize', this.resizeEventDelegate);

    const eci = this.threeJsComponent;

    if (eci) {
      if (eci.canvas) {
        this.domElement?.removeChild(eci.canvas);
      }

      const EVENTS = EmberComponentInterfaceEvents;

      eci.removeEventListener(EVENTS.ENTITIES_ADDED, this.onEntitiesAdded, this);
      eci.removeEventListener(EVENTS.DOUBLE_CLICK, this.onDoubleClick, this);
      eci.removeEventListener(EVENTS.MOUSE_DOWN, this.onMouseDown, this);
      eci.removeEventListener(EVENTS.ROLL_OVER, this.onRollOver, this);
      eci.removeEventListener(EVENTS.ROLL_OUT, this.onRollOut, this);
      eci.removeEventListener(EVENTS.GRAPH_VIEW_ACTION, this.onGraphViewAction, this);
      eci.removeEventListener(EVENTS.GRAPH_VIEW_ENTER, this.onGraphViewEnter, this);
      eci.removeEventListener(EVENTS.GRAPH_VIEW_SUSPENDED, this.onGraphViewSuspended, this);

      if (this.shouldAutoRender) {
        eci.stopRender();
      }

      if (this.shouldDispose) {
        eci.dispose();
      } else {
        this.onGraphViewSuspended(
          new EmberComponentInterfaceEvents(EmberComponentInterfaceEvents.GRAPH_VIEW_SUSPENDED),
        );
      }
    }
  }

  handleResized({ shouldTriggerComponentReady = false } = {}) {
    if (!this.isActive) {
      return;
    }

    let width = this.parentWidth;
    let height = this.graphConfiguration.isFullScreen ? window.innerHeight : this.parentHeight;

    if (!this.threeJsComponent) {
      this.initComponent();
      this.triggerReadyAfterRender();
    } else {
      if (width !== undefined && height !== undefined) {
        this.threeJsComponent.setSize(width, height);
      }

      if (shouldTriggerComponentReady) {
        this.threeJsComponent._onComponentReady();
        this.threeJsComponent.updateTheme(this.themeManager.currentTheme);
      }
    }
  }

  triggerReadyAfterRender() {
    schedule('afterRender', () => {
      if (this.hasCanvas) {
        // Get rid of a strange bug where canvas components
        // size is not correctly evaluated the first time
        // the component is sized
        later(this, this.handleResized, {}, 10);
      }

      this.handleResized({ shouldTriggerComponentReady: true });
    });
  }

  initComponent() {
    let { assetId, data, canvasTitle } = this.graphConfiguration;
    const eInterface = this.getEmberInterfaceInstance();

    if (!this.domElement) {
      throw new Error('graph-view should not be initialised before a dom element is created');
    }

    if (!eInterface) {
      throw new Error(
        'graph-view configuration must specify either a "ComponentClass" or "componentInstance"',
      );
    }

    const EVENTS = EmberComponentInterfaceEvents;

    eInterface.addEventListener(EVENTS.ENTITIES_ADDED, this.onEntitiesAdded, this);
    eInterface.addEventListener(EVENTS.DOUBLE_CLICK, this.onDoubleClick, this);
    eInterface.addEventListener(EVENTS.MOUSE_DOWN, this.onMouseDown, this);
    eInterface.addEventListener(EVENTS.ROLL_OVER, this.onRollOver, this);
    eInterface.addEventListener(EVENTS.ROLL_OUT, this.onRollOut, this);
    eInterface.addEventListener(EVENTS.GRAPH_VIEW_ACTION, this.onGraphViewAction, this);
    eInterface.addEventListener(EVENTS.GRAPH_VIEW_ENTER, this.onGraphViewEnter, this);
    eInterface.addEventListener(EVENTS.GRAPH_VIEW_SUSPENDED, this.onGraphViewSuspended, this);

    if (!assetId) {
      this.id = guidFor(this);
    }

    this.threeJsComponent = eInterface;

    this.graphView.addView(assetId, eInterface);

    const enterEvent = new EmberComponentInterfaceEvents(
      EmberComponentInterfaceEvents.GRAPH_VIEW_ENTER,
    );

    this.onGraphViewEnter(enterEvent);

    let { canvas } = eInterface;

    if (canvas) {
      this.canvas = canvas;
      canvas.style.position = 'absolute';

      if (this.args.canvasClasses) {
        let classes = this.args.canvasClasses.split(' ');

        canvas.classList.add(...classes);
      }

      this.domElement.appendChild(canvas);
      // TODO: investigate magic delay, the canvas does not get the correct dimensions the first time arround
      // and mouse picking is offset (with increasing offset the further right the tooltip shows).
      later(this, this.handleResized, {}, 100);
    }

    if (canvasTitle && canvas) {
      canvas.setAttribute('title', canvasTitle);
      canvas.addEventListener('mouseenter', this.onMouseEnterRef);
      canvas.addEventListener('mouseleave', this.onMouseLeaveRef);
    }

    if (!this.isUsingInstance && data) {
      this.threeJsComponent.setData(data); //
    }

    if (this.shouldAutoRender) {
      this.threeJsComponent.startRender();
    }
  }

  onMouseEnter() {
    this.canvas?.setAttribute('title', '');
  }

  onMouseLeave() {
    let { canvasTitle } = this.graphConfiguration;

    this.canvas?.setAttribute('title', canvasTitle ?? '');
  }

  setupGraph = modifier((element: Element) => {
    assert('expected element to be an HTMLElement', element instanceof HTMLElement);
    this.domElement = element;

    (async () => {
      await Promise.resolve();
      this.handleResized();
      this.resizeObserver = new ResizeObserver(() => this.handleResized());
      this.resizeObserver.observe(element);
    })();

    return () => {
      this.dispose();

      this.resizeObserver?.unobserve(element);

      this.canvas?.removeEventListener('mouseenter', this.onMouseEnterRef);
      this.canvas?.removeEventListener('mouseleave', this.onMouseLeaveRef);
    };
  });

  updateIsActive = modifier(() => {
    this.isActive = this.graphConfiguration.isActive;
  });

  get isUsingInstance() {
    return Boolean(this.graphConfiguration.emberComponentInterfaceInstance);
  }

  get shouldAutoRender() {
    let isAutoRenderPresent = isPresent(this.graphConfiguration.shouldAutoRender);

    return isAutoRenderPresent ? this.graphConfiguration.shouldAutoRender : true;
  }

  get shouldDispose() {
    let isShouldDisposePresent = isPresent(this.graphConfiguration.shouldDispose);

    return isShouldDisposePresent ? this.graphConfiguration.shouldDispose : true;
  }

  get graphConfiguration() {
    return Object.assign({}, this.args.graphConfiguration);
  }

  get assetId() {
    return this.graphConfiguration.assetId;
  }

  get hasCanvas() {
    return Boolean(this?.threeJsComponent?.canvas);
  }

  get parentHeight() {
    return this.domElement?.offsetHeight;
  }

  get parentWidth() {
    return this.domElement?.offsetWidth;
  }

  private getEmberInterfaceInstance() {
    let {
      EmberComponentInterfaceClass: ComponentClass,
      emberComponentInterfaceInstance: componentInstance,
    } = this.graphConfiguration;

    if (this.isUsingInstance) {
      return componentInstance;
    }

    if (ComponentClass && this.domElement) {
      let entityConfig = graphViewSettings(this.graphConfiguration, this);

      entityConfig.viewSettings.threeJSParams.containerElement = this.domElement;
      entityConfig.viewSettings.threeJSParams.isFullScreen = entityConfig.isFullScreen;

      return new ComponentClass(entityConfig.viewSettings);
    }
  }

  private onGraphViewEnter(e: EmberComponentInterfaceEvents) {
    // TODO check that this.assetId returns the correct id
    e.id = this.assetId;
    this.runAction('onGraphViewEnter', e);
  }

  private onGraphViewSuspended(e: EmberComponentInterfaceEvents) {
    // TODO check that this.assetId returns the correct id
    e.id = this.assetId;
    this.runAction('onGraphViewSuspended', e);
  }

  private onGraphViewAction(e: EmberComponentInterfaceEvents) {
    this.runAction('onGraphViewAction', e);
  }

  private onMouseDown(e: EmberComponentInterfaceEvents) {
    this.runAction('onMouseDown', e);
  }

  private onDoubleClick(e: EmberComponentInterfaceEvents) {
    this.runAction('onDoubleClick', e);
  }

  private onEntitiesAdded(e: EmberComponentInterfaceEvents) {
    this.runAction('onEntitiesAdded', e);
  }

  private onRollOut(e: EmberComponentInterfaceEvents) {
    this.runAction('onRollOut', e);
  }

  private onRollOver(e: EmberComponentInterfaceEvents) {
    this.runAction('onRollOver', e);
  }

  private runAction(action: GraphConfigurationActions, param: EmberComponentInterfaceEvents) {
    let actionRef = this.graphConfiguration[action];

    if (actionRef) {
      return actionRef(param);
    }
  }
}
