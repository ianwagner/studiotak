# Studio Tak

This repository is a pnpm monorepo managed with Turborepo.

## Monorepo structure

```
apps/       # application projects
  campfire/ # React web app
  stash/    # additional app
packages/
  shared-ui/ # shared React components and utilities
```

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or newer is recommended)
- [pnpm](https://pnpm.io/) (the workspace uses pnpm 10)

## Basic commands

Install dependencies for all workspaces:

```bash
pnpm install
```

Run apps in development mode:

```bash
pnpm turbo run dev
```

Build all apps and packages:

```bash
pnpm turbo run build
```

## Environment variables

The build pipeline defined in `turbo.json` requires several Firebase-related
variables:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Ensure these are available in your shell or in an `.env` file before running
`pnpm turbo run build` so the apps receive the correct configuration.
