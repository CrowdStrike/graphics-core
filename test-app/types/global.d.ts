declare module '@ember/component' {
  export function setComponentTemplate(...args: any[]): unknown;
}

declare module "*.png" {
  const value: string;
  export default value;
}
