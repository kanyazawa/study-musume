#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script must be run on macOS." >&2
  exit 1
fi

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found: $cmd" >&2
    exit 1
  fi
}

require_command node
require_command npm
require_command npx
require_command xcodebuild
require_command xcode-select

echo "Using project root: $PROJECT_ROOT"

if [[ ! -d node_modules ]]; then
  echo "Installing npm dependencies..."
  npm install
fi

if ! npm ls @capacitor/ios >/dev/null 2>&1; then
  echo "Installing @capacitor/ios..."
  npm install @capacitor/ios
fi

if [[ ! -d ios ]]; then
  echo "Creating Capacitor iOS project..."
  npx cap add ios
fi

echo "Building web assets..."
npm run build

echo "Syncing Capacitor iOS project..."
npx cap sync ios

cat <<'EOF'

iOS project is ready.

Next steps:
  1. npx cap open ios
  2. In Xcode, select the App target
  3. Set Signing & Capabilities with your Apple ID team
  4. Connect an iPhone and press Run

Notes:
  - iPhone home screen PWA login issues do not affect the native iOS app shell.
  - Google login inside the native app still needs a native iOS auth flow.
EOF
