# termux-opencode-simple

Fork ringan [opencode](https://github.com/sst/opencode) v1.18.32 yang dirampingkan
khusus **Termux** (Android). Binary hasil build berjalan native di Termux
(bionic libc) dan bisa di-rebuild kapan saja dari source.

## Kenapa fork ini ada

Release resmi opencode untuk linux-arm64 dibangun dengan **glibc** — tidak bisa
dijalankan di Termux yang memakai **bionic libc**. Fork ini:

1. Membangun binary **linux-arm64 glibc** yang kompatibel dengan bionic
2. Mem-patch OpenTUI agar berjalan di platform `android`
3. Menyertakan `libopentui.so` versi bionic (di `vendor/`)
4. Membuang semua yang tidak relevan di Termux

## Perbedaan vs upstream

| Aspek | Upstream | Fork ini |
|-------|----------|----------|
| Ukuran binary | 189MB | **132.8MB** |
| Target build | 12 platform (linux/darwin/win32, musl, avx2) | **1 target: linux-arm64** |
| Web UI embed | Ada | Tidak (CLI/TUI tidak butuh) |
| Command `upgrade` | Ada | **Dihapus** — download release glibc yang tidak jalan di Termux |
| Command `web` | Ada | **Dihapus** — butuh browser + web UI embed |
| Command `github` / `pr` | Ada | **Dihapus** — butuh layanan GitHub eksternal |
| Path di prompt TUI | `/data/data/.../home/code` | **`~/code`** (patch `abbreviateHome`) |
| Reproducible | Tidak (binary jadi) | **Ya** — `bun run build:termux` |

## Package yang dibuang (vs upstream)

`app`, `desktop`, `console`, `web`, `storybook`, `session-ui`, `slack`,
`enterprise`, `cli`, `client`, `function`, `httpapi-codegen`, `sdk-next`,
`infra`, `nix`, `github`, `install`, `sdks`, `specs`, `perf`, `patches` +
26 workflow CI + script dev (publish, schema, bench, dll).

Dipertahankan 15 package inti: `opencode`, `tui`, `core`, `server`, `llm`,
`plugin`, `protocol`, `schema`, `sdk`, `script`, `codemode`, `ui`,
`http-recorder`, `effect-drizzle-sqlite`, `effect-sqlite-node`.

## Command yang tersedia

```
completion  acp  mcp  [project]  attach  run  debug  providers
agent  uninstall  serve  models  stats  export  import  session  plugin  db
```

Semua terverifikasi jalan di Termux. Global flags (`--model`, `--continue`,
`--session`, `--fork`, `--auto`, `--mini`, `--port`, `--hostname`, `--cors`,
dll) juga terverifikasi.

## Build

Persyaratan: Termux dengan `bun` terpasang (`pkg install bun`).

```bash
git clone https://github.com/azrialwork/termux-opencode-simple
cd termux-opencode-simple
bun install
bun run build:termux
```

Build memakan ~15 menit. Output:

```
packages/opencode/dist/opencode-linux-arm64/bin/opencode
```

Pasang:

```bash
cp packages/opencode/dist/opencode-linux-arm64/bin/opencode $PREFIX/bin/opencode
```

## Patch Termux

1. **`script/patch-termux-tui.sh`** — memaksa OpenTUI mengenali platform
   `android` sebagai `linux` dan menukar `libopentui.so` glibc (npm) dengan
   versi bionic dari `vendor/`. Idempotent, dijalankan otomatis saat build.
2. **`vendor/libopentui-bionic.so`** — library OpenTUI bionic (sudah di-strip,
   5MB), diekstrak dari build Termux yang berfungsi.
3. **`packages/tui/src/component/prompt/index.tsx`** — path prompt TUI
   disingkat dengan `abbreviateHome` → `~/code`.

## Catatan

- Versi dasar: `v1.18.32`
- Data & config berbagi dengan opencode asli: `~/.local/share/opencode`,
  `~/.config/opencode`
- Lisensi: MIT (mengikuti upstream)