# termux-opencode-simple

Fork ringan [opencode](https://github.com/sst/opencode) yang dirampingkan khusus
penggunaan di **Termux** (Android). Berisi hanya fitur yang berjalan di terminal:
CLI, TUI, agent, tools, MCP — tanpa web UI, desktop app, dan integrasi lain yang
tidak relevan di Android.

## Yang dibuang (vs upstream v1.18.32)

| Package | Alasan |
|---------|--------|
| `app` (web UI) | Tidak dipakai di Termux; build di-skip (`--skip-embed-web-ui`) |
| `desktop` | Aplikasi desktop, tidak jalan di Android |
| `console`, `web`, `storybook`, `session-ui`, `ui` (web) | UI web/console |
| `slack`, `enterprise` | Integrasi yang tidak relevan |
| `cli`, `client`, `function`, `httpapi-codegen`, `sdk-next` | Tidak dibutuhkan oleh graph dependensi CLI |
| `infra`, `nix`, `github`, `install`, `sdks`, `specs`, `perf`, `patches` | Tooling rilis/CI upstream |

## Yang dipertahankan

15 package inti: `opencode`, `tui`, `core`, `server`, `llm`, `plugin`,
`protocol`, `schema`, `sdk`, `script`, `codemode`, `ui`, `http-recorder`,
`effect-drizzle-sqlite`, `effect-sqlite-node`.

## Patch Termux

- **Path `~` di TUI**: komponen prompt menampilkan path dengan `abbreviateHome`
  (sama seperti footer), sehingga `/data/data/com.termux/files/home/code`
  tampil sebagai `~/code`. Ini perbaikan kosmetik yang belum ada di upstream.

## Build

```bash
bun install
bun run build:termux
```

Output: `packages/opencode/dist/opencode-linux-arm64/bin/opencode`

Pasang:

```bash
cp packages/opencode/dist/opencode-linux-arm64/bin/opencode $PREFIX/bin/opencode
```

## Catatan

- Versi dasar: `v1.18.32` (sinkron dengan opencode yang terpasang).
- Update upstream: `git fetch` lalu cherry-pick/merge dari repo sst/opencode.