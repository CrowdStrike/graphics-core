declare module '@ember/component' {
  export function setComponentTemplate(...args: unknown[]): unknown;
}

declare module '*.png' {
  const value: string;
  export default value;
}
