# Indonesian-Game

Desktop app for learning **Indonesian** (Jakarta casual / colloquial focus) from English—structured as a **skill-tree** progression game with in-game economy and optional cosmetic **gacha**, built with **Tauri 2**, **React**, **TypeScript**, and **Vite**.

Product design and data model live in the Cursor plan; the codebase will grow in small, reviewable steps.

## Requirements (Windows)

- [Node.js](https://nodejs.org/) LTS or current
- [Rust](https://rustup.rs/) (stable)
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Desktop development with C++)
- WebView2 (usually preinstalled on Windows 10/11)

See also: [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

## Setup

```bash
git clone https://github.com/MMaciej-png/Indonesian-Game.git
cd Indonesian-Game
npm install
```

## Run (development)

```bash
npm run tauri dev
```

Opens the native desktop window with hot reload.

## Build (release binary)

```bash
npm run tauri build
```

Artifacts appear under `src-tauri/target/release/` and the app bundle path configured in Tauri.

## Frontend only (optional)

```bash
npm run dev
```

Vite in the browser—Tauri APIs are not available; use for quick UI experiments.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md): issues, branches, PRs, and commit messages.

## License

[MIT](LICENSE)
