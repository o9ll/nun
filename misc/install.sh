#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

check_root() {
    if [ "$(id -u)" -eq 0 ]; then
        error "This script should not be run as root. Please run as a normal user."
    fi
}

main() {
    check_root

    if ! command -v pnpm >/dev/null; then
        error "pnpm is required. Install it, then run this script again."
    fi

    echo -e "${YELLOW}Building and running the local installer...${NC}"
    cd "$REPO_ROOT"
    pnpm inject "$@"

    echo -e "\n${GREEN}Installation completed successfully!${NC}"
}

main "$@"
