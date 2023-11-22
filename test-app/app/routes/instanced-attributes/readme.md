In order to extract the positions of the icons that are loaded I used the following code from inside `graph-entities/test-app`. I also exported the image of the SvgMeshGenerator canvas.

```ts
for (let [key, value] of SvgMeshGenerator._svgGeometries) {
  const [x, y, w, h] = value.region?.normalizedCoordinates;
  const { width, height } = SvgMeshGenerator.getIconMetrics(key);

  out[key] = {
    x,
    y,
    w,
    h,
    width,
    height,
  };
}

console.log(out);
```
