#!/bin/bash

# Docs Test Script
# Tests that documentation builds successfully before committing

set -e

echo "========================================"
echo "  Uizy Documentation Test"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to docs directory
cd "$(dirname "$0")/docs"

echo -e "${YELLOW}[1/3]${NC} Clearing Docusaurus cache..."
npm run clear 2>/dev/null || true

echo ""
echo -e "${YELLOW}[2/3]${NC} Building documentation..."
if npm run build; then
    echo ""
    echo -e "${GREEN}[3/3] Build successful!${NC}"
    echo ""
    echo "========================================"
    echo -e "${GREEN}  All checks passed!${NC}"
    echo "========================================"
    echo ""
    echo "You can now safely commit your changes."
    exit 0
else
    echo ""
    echo -e "${RED}[3/3] Build failed!${NC}"
    echo ""
    echo "========================================"
    echo -e "${RED}  Documentation build failed${NC}"
    echo "========================================"
    echo ""
    echo "Please fix the errors above before committing."
    exit 1
fi
