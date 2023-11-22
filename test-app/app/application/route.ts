import Route from '@ember/routing/route';

export default class GraphicsRoute extends Route {
  async beforeModel() {
    document.body.classList.add('theme-dark');
    document.body.classList.add('bg-basement');
  }
}
