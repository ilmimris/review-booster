#!/usr/bin/env bash
# Run all validation and unit tests for Review Booster.
# Usage: bash test.sh
set -e

echo "========================================"
echo "  Review Booster — Test Suite"
echo "========================================"

echo ""
echo ">>> Running validate.cjs..."
node validate.cjs

echo ""
echo ">>> Running popup.test.cjs..."
node popup/popup.test.cjs

echo ""
echo "========================================"
echo "  All tests passed ✓"
echo "========================================"
