# Studio Tak Monorepo

This repository is managed with [pnpm workspaces](https://pnpm.io/workspaces) and
[turborepo](https://turbo.build/). All applications live under `apps/` and shared
code lives under `packages/`.

```
apps/
  campfire/    # main web application
packages/
  shared-ui/   # reusable React components and utilities
```

## Getting Started

Install all dependencies from the repository root:

```bash
pnpm install
```

### Running the Campfire App

To start the development server for `apps/campfire` run:

```bash
pnpm --filter campfire dev
```

The command executes the `dev` script defined in `apps/campfire/package.json`
which launches Vite.

### Executing Tests

Unit tests for Campfire are located in the same workspace. Execute them with:

```bash
pnpm --filter campfire test
```

This runs Jest using the configuration in `apps/campfire/jest.config.js`.
