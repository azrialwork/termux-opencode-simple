#!/usr/bin/env bun

// Termux-only build: single linux-arm64 glibc binary, no web UI embed,
// no release machinery. Run via `bun run build:termux` at the repo root.

import { $ } from "bun"
import path from "path"
import { fileURLToPath } from "url"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

const generated = await import("./generate.ts")

import { Script } from "@opencode-ai/script"
import pkg from "../package.json"

const skipInstall = process.argv.includes("--skip-install")
const plugin = createSolidTransformPlugin()

const target = { os: "linux", arch: "arm64" as const }
const name = `${pkg.name}-${target.os}-${target.arch}`

await $`rm -rf dist`

if (!skipInstall) {
  await $`bun install --os="*" --cpu="*" @opentui/core@${pkg.dependencies["@opentui/core"]}`
  await $`bun install --os="*" --cpu="*" @parcel/watcher@${pkg.dependencies["@parcel/watcher"]}`
  await $`bun install --os="*" --cpu="*" @ff-labs/fff-bun@${pkg.dependencies["@ff-labs/fff-bun"]}`
  // Termux: OpenTUI refuses platform "android" and the npm linux-arm64
  // libopentui.so is glibc. Patch the resolver + swap in the bionic build.
  await $`bash ../../script/patch-termux-tui.sh`
}

console.log(`building ${name}`)
await $`mkdir -p dist/${name}/bin`

const workerPath = "./src/cli/tui/worker.ts"
const treeSitterWorkerPath = "opentui-tree-sitter-worker.js"
const treeSitterWorker = await Bun.file(fileURLToPath(import.meta.resolve("@opentui/core/parser.worker"))).text()
const bunfsRoot = "/$bunfs/root/"

await Bun.build({
  conditions: ["bun", "node"],
  tsconfig: "./tsconfig.json",
  plugins: [plugin],
  external: ["node-gyp"],
  format: "esm",
  minify: true,
  sourcemap: "none",
  splitting: true,
  compile: {
    autoloadBunfig: false,
    autoloadDotenv: false,
    autoloadTsconfig: true,
    autoloadPackageJson: true,
    target: name.replace(pkg.name, "bun") as any,
    outfile: `dist/${name}/bin/opencode`,
    execArgv: [`--user-agent=opencode/${Script.version}`, "--use-system-ca", "--"],
  },
  files: {
    [treeSitterWorkerPath]: treeSitterWorker,
  },
  entrypoints: ["./src/index.ts", workerPath, treeSitterWorkerPath],
  define: {
    FFF_LIBC: JSON.stringify("gnu"),
    OPENCODE_VERSION: `'${Script.version}'`,
    OPENCODE_MODELS_DEV: generated.modelsData,
    OTUI_TREE_SITTER_WORKER_PATH: bunfsRoot + treeSitterWorkerPath,
    OPENCODE_WORKER_PATH: workerPath,
    OPENCODE_CHANNEL: `'${Script.channel}'`,
    OPENCODE_LIBC: "'glibc'",
    "process.env.OPENTUI_LIBC": JSON.stringify("glibc"),
  },
})

// Smoke test: binary must run on this machine
const binaryPath = `dist/${name}/bin/opencode`
console.log(`Running smoke test: ${binaryPath} --version`)
try {
  const versionOutput = await $`${binaryPath} --version`.text()
  console.log(`Smoke test passed: ${versionOutput.trim()}`)
} catch (e) {
  console.error(`Smoke test failed for ${name}:`, e)
  process.exit(1)
}

await $`rm -rf ./dist/${name}/bin/tui`
await Bun.file(`dist/${name}/package.json`).write(
  JSON.stringify(
    {
      name,
      version: Script.version,
      preferUnplugged: true,
      os: [target.os],
      cpu: [target.arch],
    },
    null,
    2,
  ),
)