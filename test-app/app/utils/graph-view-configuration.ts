import { ThreeJSViewParams } from '@crowdstrike/graphics-core';

import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';
import type { EmberComponentInterfaceEvents } from 'test-app-for-graphics-core/utils/ember-component-interface-events';
import type { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';

export type GraphConfigurationActions =
  | 'onGraphViewAction'
  | 'onGraphViewEnter'
  | 'onGraphViewSuspended'
  | 'onEntitiesAdded'
  | 'onMouseDown'
  | 'onRollOut'
  | 'onRollOver'
  | 'onDoubleClick';

export default class GraphViewConfiguration<
  TData = unknown,
  ThreeInterface extends ThreeJsComponentInterface = ThreeJsComponentInterface,
> {
  /**
   * string: id of graph
   */
  assetId: string;
  /**
   * title of canvas element
   */
  canvasTitle?: string;
  /**
   * data: data object for graph. Usually an instance of `graph-data`
   */
  data: TData;
  /**
   * class that will be instantiated to create the chart (must extend EmberComponentInterface)
   */
  EmberComponentInterfaceClass?: { new (p: EmberComponentInterfaceParams): ThreeInterface };
  /**
   * @property instance of the char
   */
  emberComponentInterfaceInstance?: ThreeInterface;
  /**
   * is the chart active by default
   */
  isActive = true;
  /**
   * is the chart full screen
   */
  isFullScreen = false;
  /**
   * handler to handle miscellaneous actions / events from the graph
   */
  onGraphViewAction?: (e: EmberComponentInterfaceEvents) => unknown;
  onGraphViewEnter?: (e: EmberComponentInterfaceEvents) => unknown;
  onGraphViewSuspended?: (e: EmberComponentInterfaceEvents) => unknown;
  onMouseDown?: (e: EmberComponentInterfaceEvents) => unknown;
  onRollOut?: (e: EmberComponentInterfaceEvents) => unknown;
  onDoubleClick?: (e: EmberComponentInterfaceEvents) => unknown;
  onRollOver?: (e: EmberComponentInterfaceEvents) => unknown;
  onEntitiesAdded?: (e: EmberComponentInterfaceEvents) => unknown;
  /**
   * automatically start rendering the chart
   */
  shouldAutoRender: boolean;
  /**
   * dispose the chart with the component
   */
  shouldDispose: boolean;
  /**
   * user specified settings for EmberComponentInterfaceClass
   */
  viewSettings: EmberComponentInterfaceParams = {
    rootURL: '',
    threeJSParams: new ThreeJSViewParams(),
  };

  constructor({
    assetId,
    canvasTitle,
    data,
    EmberComponentInterfaceClass,
    emberComponentInterfaceInstance,
    isActive,
    isFullScreen,
    onDoubleClick,
    onRollOut,
    onRollOver,
    onMouseDown,
    onEntitiesAdded,
    onGraphViewAction,
    onGraphViewEnter,
    onGraphViewSuspended,
    shouldAutoRender,
    shouldDispose,
    threeJSParams,
  }: {
    assetId: string;
    canvasTitle?: string;
    data: TData;
    EmberComponentInterfaceClass?: { new (p: EmberComponentInterfaceParams): ThreeInterface };
    emberComponentInterfaceInstance?: ThreeInterface;
    isActive?: boolean;
    isFullScreen?: boolean;
    onRollOut?: (e: EmberComponentInterfaceEvents) => unknown;
    onRollOver?: (e: EmberComponentInterfaceEvents) => unknown;
    onMouseDown?: (e: EmberComponentInterfaceEvents) => unknown;
    onEntitiesAdded?: (e: EmberComponentInterfaceEvents) => unknown;
    onDoubleClick?: (e: EmberComponentInterfaceEvents) => unknown;
    onGraphViewAction?: (e: EmberComponentInterfaceEvents) => unknown;
    onGraphViewEnter?: (e: EmberComponentInterfaceEvents) => unknown;
    onGraphViewSuspended?: (e: EmberComponentInterfaceEvents) => unknown;
    shouldAutoRender: boolean;
    shouldDispose: boolean;
    threeJSParams?: ThreeJSViewParams;
  }) {
    this.assetId = assetId;
    this.canvasTitle = canvasTitle;
    this.data = data;
    this.EmberComponentInterfaceClass = EmberComponentInterfaceClass;
    this.emberComponentInterfaceInstance = emberComponentInterfaceInstance;
    this.shouldAutoRender = shouldAutoRender;
    this.shouldDispose = shouldDispose;

    if (threeJSParams) {
      this.viewSettings.threeJSParams = threeJSParams;
    }

    if (isFullScreen !== undefined) {
      this.isFullScreen = isFullScreen;
    }

    if (isActive !== undefined) {
      this.isActive = isActive;
    }

    this.onEntitiesAdded = onEntitiesAdded;
    this.onDoubleClick = onDoubleClick;
    this.onRollOut = onRollOut;
    this.onGraphViewAction = onGraphViewAction;
    this.onGraphViewEnter = onGraphViewEnter;
    this.onGraphViewSuspended = onGraphViewSuspended;
    this.onRollOver = onRollOver;
    this.onMouseDown = onMouseDown;
  }
}
