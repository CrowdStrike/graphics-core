# How To Contribute

## Installation

`@crowdstrike/graphics-core` uses [PNPM](https://pnpm.io) as its package manager.

```
git clone git@github.com:CrowdStrike/graphics.git
cd graphics
pnpm install
```

## Developing

To develop the package, `cd` into the `package` folder and run:

```
pnpm start
```

This will:

- Build the package and watch it for changes

## Releasing

## Building the Package

- `cd package`
- `pnpm start`

## Running the Demos

```
cd test-app
pnpm start
```

and visit `http://localhost:4200`

## Running the Test Suite

```
cd test-app
pnpm start
```

and visit `http://localhost:4200/tests` to view your tests.

## VS Code Setup

Upon opening the repo in VS Code, you may be prompted to download the recommended extensions that help with linting. The following workspace settings are recommended in order to get Prettier to auto-save and ESLint working:

```
// Disable all vscode internal formatters; They tend to collide with eslint
"html.format.enable": false,
"json.format.enable": false,
"typescript.format.enable": false,
"javascript.format.enable": false,
// Enable eslint formatter; We use this as a main formatter in monorepo
"eslint.format.enable": true,
"eslint.workingDirectories": [
    "package",
    "test-app"
],
// Enable format on save
"editor.formatOnSave": true,
"[javascript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
},
"[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
},
```
