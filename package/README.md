# @crowdstrike/graphics-core

This package contains the `@crowdstrike/graphics-core` addon (in `./package`) and the tests/ dummy app for this addon
(in `./test-app`);

## Usage

```
yarn ember install @crowdstrike/graphics-core
```

(or in the monorepo you will need to just add it to the relevant `package.json` and run `yarn`)

## Contributing

For the best ergonomics, developing this addon will require 2 terminals:

In one terminal, start this addon in "watch" mode

```
yarn start
# or if you know that this addon does not need any of its dependencies built locally
yarn watch:js
```

In the other terminal, start the app,

```
yarn start
```

and visit `/tests` at the URL printed in the terminal

### References

The addon is built with [Rollup.JS](https://rollupjs.org/).

For more information on V2 Addons, read (in-order):

- https://emberjs.github.io/rfcs/0507-embroider-v2-package-format.html
- https://github.com/embroider-build/embroider/blob/main/ADDON-AUTHOR-GUIDE.md
- https://github.com/embroider-build/embroider/blob/main/PORTING-ADDONS-TO-V2.md
- https://github.com/embroider-build/embroider/tree/main/packages/test-setup
