#!/bin/zsh -l
# Double-click to start Happy Desktop in development mode (`pnpm dev`).

cd "${0:A:h}" || exit 1

fail() {
    echo
    echo "$1"
    read -k1 "?Press any key to close."
    exit 1
}

# Terminal opens a login shell, which does not read ~/.zshrc, where nvm usually loads.
if ! command -v pnpm >/dev/null 2>&1; then
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi
command -v pnpm >/dev/null 2>&1 || fail "pnpm was not found. Install Node.js 24+ and pnpm, then try again."

# Picks up dependencies added since the last pull; takes a second when nothing changed.
pnpm install --frozen-lockfile || fail "pnpm install failed. See the output above."

pnpm dev || fail "pnpm dev stopped with an error. See the output above."
