#!/usr/bin/env bash
# patch-termux-tui.sh — make OpenTUI work on Termux (android-arm64).
#
# Two problems:
#   1. OpenTUI's asset resolver refuses platform "android" (only darwin/linux/win32).
#      Force platform "linux" so it picks the linux-arm64 native lib.
#   2. The npm linux-arm64 libopentui.so is glibc; Termux is bionic.
#      Swap in the bionic build from vendor/.
#
# Idempotent: safe to run repeatedly. Must run AFTER `bun install` (which
# resets the store to the glibc .so).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_SO="$ROOT/vendor/libopentui-bionic.so"

# Locate the @opentui/core store chunk (bun store layout: node_modules/.bun/@opentui+core@*/node_modules/@opentui/core/)
CORE_DIR="$(ls -d "$ROOT"/node_modules/.bun/@opentui+core@*/node_modules/@opentui/core 2>/dev/null | head -n1)"
if [ -z "$CORE_DIR" ]; then
  echo "error: @opentui/core not found in bun store" >&2
  exit 1
fi

CHUNK_JS="$(ls "$CORE_DIR"/chunk-bun-*.js 2>/dev/null | head -n1)"
[ -n "$CHUNK_JS" ] || { echo "error: no chunk-bun-*.js in $CORE_DIR" >&2; exit 1; }

# 1) platform literal: getCurrentNodeAssetTarget() returns platform "linux"
if grep -q 'platform: "linux",' "$CHUNK_JS"; then
  echo "platform patch already applied"
else
  sed -i 's/platform: process\.platform,/platform: "linux",/' "$CHUNK_JS"
  echo "platform literal patched"
fi

# 2) linux branch force: resolveNativeLibraryPath() takes the linux import path
if grep -q 'if (true) {' "$CHUNK_JS"; then
  echo "branch force already applied"
else
  sed -i 's/if (process\.platform === "linux") {/if (true) {/' "$CHUNK_JS"
  echo "branch force patched"
fi

# 3) swap glibc .so for the bionic build
SO_DIR="$(ls -d "$ROOT"/node_modules/.bun/@opentui+core-linux-arm64@*/node_modules/@opentui/core-linux-arm64 2>/dev/null | head -n1)"
if [ -z "$SO_DIR" ]; then
  echo "error: @opentui/core-linux-arm64 not found in bun store" >&2
  exit 1
fi
if cmp -s "$VENDOR_SO" "$SO_DIR/libopentui.so"; then
  echo "bionic libopentui.so already in place"
else
  cp -f "$VENDOR_SO" "$SO_DIR/libopentui.so"
  echo "swapped glibc libopentui.so -> bionic"
fi