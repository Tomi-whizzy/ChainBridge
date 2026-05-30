#!/bin/bash
# =============================================================================
# ChainBridge Deployment Verification Script
# =============================================================================
# Queries the deployed contract to confirm it is live and correctly initialized.
# Exits non-zero if any check fails.
#
# Usage:
#   ./scripts/verify.sh --contract <id> [--config <env-file>]
#
# Options:
#   --contract  Contract ID to verify (required)
#   --config    Path to env file (default: scripts/config/testnet.env)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SMARTCONTRACT_DIR="${SCRIPT_DIR}/../smartcontract"
RELAYER_DIR="${SCRIPT_DIR}/../relayer"

# ---------------------------------------------------------------------------
# Static analysis: run cargo clippy on the smart contract
# ---------------------------------------------------------------------------
echo "============================================"
echo "Running cargo clippy on smartcontract"
echo "============================================"

if ! command -v cargo &>/dev/null; then
    echo "ERROR: cargo not found. Install Rust toolchain to run clippy."
    exit 1
fi

(cd "${SMARTCONTRACT_DIR}" && cargo clippy -- -D warnings)
echo "  PASS  cargo clippy passed"
echo ""

# ---------------------------------------------------------------------------
# Static analysis: run cargo clippy on the relayer
# ---------------------------------------------------------------------------
echo "============================================"
echo "Running cargo clippy on relayer"
echo "============================================"

(cd "${RELAYER_DIR}" && cargo clippy -- -D warnings)
echo "  PASS  cargo clippy passed (relayer)"
echo ""

CONFIG_FILE="${SCRIPT_DIR}/config/testnet.env"
CONTRACT_ID=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --contract) CONTRACT_ID="$2"; shift 2 ;;
        --config)   CONFIG_FILE="$2"; shift 2 ;;
        *)          echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [[ -z "$CONTRACT_ID" ]]; then
    # Fall back to .deployed file
    DEPLOYED_INFO="${SCRIPT_DIR}/config/.deployed"
    if [[ -f "$DEPLOYED_INFO" ]]; then
        # shellcheck source=/dev/null
        source "$DEPLOYED_INFO"
    fi
    if [[ -z "${CONTRACT_ID:-}" ]]; then
        echo "ERROR: --contract is required or run deploy.sh first."
        exit 1
    fi
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "ERROR: Config file not found: $CONFIG_FILE"
    exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG_FILE"

PASS=0
FAIL=0

check() {
    local description="$1"
    local result="$2"
    local expected="$3"

    if [[ "$result" == *"$expected"* ]]; then
        echo "  PASS  $description"
        PASS=$((PASS + 1))
    else
        echo "  FAIL  $description"
        echo "         expected: $expected"
        echo "         got:      $result"
        FAIL=$((FAIL + 1))
    fi
}

echo "============================================"
echo "ChainBridge Verification - ${STELLAR_NETWORK}"
echo "Contract: ${CONTRACT_ID}"
echo "============================================"
echo ""

# Check 1: Contract instance exists (get_storage_metrics does not require init)
echo "--- Checking contract is reachable ---"
METRICS=$(stellar contract invoke \
    --network "${STELLAR_NETWORK}" \
    --id "${CONTRACT_ID}" \
    -- get_storage_metrics 2>&1 || echo "INVOKE_FAILED")
check "contract responds to get_storage_metrics" "$METRICS" "total_htlcs"

# Check 2: Verify metrics show zero counts on fresh deploy
check "total_htlcs is 0 on fresh deploy" "$METRICS" '"total_htlcs":0'
check "total_orders is 0 on fresh deploy" "$METRICS" '"total_orders":0'
check "total_swaps is 0 on fresh deploy"  "$METRICS" '"total_swaps":0'

# Check 3: Verify create_htlc rejects zero amount (contract error #4)
echo ""
echo "--- Checking input validation ---"
ZERO_AMOUNT=$(stellar contract invoke \
    --network "${STELLAR_NETWORK}" \
    --source "${DEPLOYER_SECRET_KEY:-}" \
    --id "${CONTRACT_ID}" \
    -- create_htlc \
    --sender "${ADMIN_ADDRESS:-GAUVRN6MPRQGAQNP3YVQYF5TNWBIPQBQQEHCHGXQ2QBKK5X3QYQKQ}" \
    --receiver "${ADMIN_ADDRESS:-GAUVRN6MPRQGAQNP3YVQYF5TNWBIPQBQQEHCHGXQ2QBKK5X3QYQKQ}" \
    --amount 0 \
    --hash_lock "0000000000000000000000000000000000000000000000000000000000000000" \
    --time_lock 9999999999 2>&1 || echo "CONTRACT_ERROR")
check "zero-amount HTLC rejected" "$ZERO_AMOUNT" "CONTRACT_ERROR"

echo ""
echo "============================================"
echo "Verification complete: ${PASS} passed, ${FAIL} failed"
echo "============================================"

if [[ $FAIL -gt 0 ]]; then
    exit 1
fi
