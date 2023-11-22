import Controller from '@ember/controller';

import { MultiTextureShaderDemoModifier } from './demo-modifier';

export default class MultiTextureShaderDemoController extends Controller {
  demo = MultiTextureShaderDemoModifier;
}
