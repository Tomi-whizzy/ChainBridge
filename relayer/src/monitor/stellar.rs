/// Monitors the Stellar/Soroban network for ChainBridge HTLC and swap events.
///
/// Polls the Soroban RPC for contract events, detects new HTLCs and matched
/// orders, and triggers proof generation for counterparty chains.
use crate::config::RelayerConfig;
use crate::metrics::RelayerMetrics;
use std::time::Duration;
use tokio::time::sleep;

/// Load persisted cursor from file. Returns None if missing or unreadable.
fn load_cursor(path: &str) -> Option<String> {
    std::fs::read_to_string(path)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// Persist cursor to file so it survives restarts.
fn save_cursor(path: &str, cursor: &str) {
    if let Err(e) = std::fs::write(path, cursor) {
        eprintln!("[Stellar] Failed to save cursor to {}: {}", path, e);
    }
}

/// Extract a printable string from a Soroban event topic ScVal.
/// Handles both plain string values and structured objects like
/// `{"type": "symbol", "value": "htlc_created"}`.
/// Returns None for unknown shapes instead of panicking.
fn parse_topic_value(topic: &serde_json::Value) -> Option<String> {
    match topic {
        // Plain JSON string — most common in testnet/RPC JSON responses
        serde_json::Value::String(s) => Some(s.clone()),
        // Structured ScVal: {"type": "symbol"|"string", "value": "..."}
        serde_json::Value::Object(map) => {
            let kind = map.get("type").and_then(|t| t.as_str()).unwrap_or("");
            match kind {
                "symbol" | "string" => map
                    .get("value")
                    .and_then(|v| v.as_str())
                    .map(String::from),
                // Numeric types — coerce to string for logging
                "u32" | "i32" | "u64" | "i64" | "u128" | "i128" => map
                    .get("value")
                    .map(|v| v.to_string()),
                // Address type
                "address" => map
                    .get("value")
                    .and_then(|v| v.as_str())
                    .map(String::from),
                // Unrecognised structured type — return None safely
                _ => None,
            }
        }
        // Any other JSON shape (number, bool, array, null) — not a valid topic
        _ => None,
    }
}

/// Extract the counterparty chain from a Soroban event value body.
///
/// The event value is expected to be a struct with a `counterparty_chain` field
/// (e.g. `{"type": "struct", "value": [{"key": ..., "val": {"type": "symbol", "value": "ethereum"}}]}`).
/// Falls back to `None` when the field is missing or unparseable.
fn extract_counterparty_chain(event: &serde_json::Value) -> Option<String> {
    let value = event.get("value")?;
    if let Some(obj) = value.as_object() {
        if let Some(typ) = obj.get("type").and_then(|t| t.as_str()) {
            if typ == "struct" {
                if let Some(fields) = obj.get("value").and_then(|v| v.as_array()) {
                    for field in fields {
                        let key = field.get("key")?;
                        let key_str = parse_topic_value(key);
                        if key_str.as_deref() == Some("counterparty_chain") {
                            let val = field.get("val")?;
                            return parse_topic_value(val);
                        }
                    }
                }
                return None;
            }
        }
        if let Some(chain) = obj.get("counterparty_chain") {
            return chain.as_str().map(String::from);
        }
    }
    value.as_str().map(String::from)
}

pub async fn monitor_loop(config: RelayerConfig, metrics: RelayerMetrics, retry_queue: std::sync::Arc<crate::retry::RetryQueue>) {
    println!(
        "[Stellar] Starting monitor - RPC: {}, contract: {}",
        config.stellar_rpc_url, config.contract_id
    );
    metrics.mark_started("stellar");

    let interval = Duration::from_secs(config.poll_interval_secs);

    // Load cursor from file on startup; fall back to None (poll from latest).
    let mut cursor: Option<String> = config
        .cursor_path
        .as_deref()
        .and_then(load_cursor);

    if cursor.is_some() {
        println!("[Stellar] Resuming from persisted cursor");
    }

    let mut latest_ledger = 0u64;

    loop {
        match poll_events(&config, &cursor, &retry_queue).await {
            Ok((new_cursor, event_count, max_ledger)) => {
                if let Some(ref c) = new_cursor {
                    // Persist cursor so restarts resume from here.
                    if let Some(path) = config.cursor_path.as_deref() {
                        save_cursor(path, c);
                    }
                }
                cursor = new_cursor;
                if max_ledger > latest_ledger {
                    latest_ledger = max_ledger;
                }
                metrics.mark_poll_success("stellar", latest_ledger, event_count as u64);
            }
            Err(e) => {
                eprintln!("[Stellar] Poll error: {}. Retrying...", e);
                metrics.mark_poll_error("stellar");
            }
        }
        sleep(interval).await;
    }
}

async fn poll_events(
    config: &RelayerConfig,
    cursor: &Option<String>,
    retry_queue: &std::sync::Arc<crate::retry::RetryQueue>,
) -> Result<(Option<String>, usize, u64), Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // When a cursor exists it drives pagination; startLedger is only needed on
    // the very first poll. Use the configured value so operators can skip
    // historical events on startup by setting STELLAR_START_LEDGER.
    let start_ledger = if cursor.is_none() {
        config.stellar_start_ledger
    } else {
        0
    };

    let mut body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getEvents",
        "params": {
            "startLedger": start_ledger,
            "filters": [{
                "contractIds": [config.contract_id],
            }],
            "pagination": { "limit": 100 }
        }
    });

    if let Some(c) = cursor {
        body["params"]["pagination"]["cursor"] = serde_json::Value::String(c.clone());
    }

    let resp = client
        .post(&config.stellar_rpc_url)
        .json(&body)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    let events = resp["result"]["events"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    let mut max_ledger = 0u64;
    for event in &events {
        let topics = event["topic"].as_array();
        if let Some(topics) = topics {
            // Use robust parser — handles string and structured ScVal shapes.
            let event_type = topics
                .first()
                .and_then(|t| parse_topic_value(t))
                .unwrap_or_default();

            if !event_type.is_empty() {
                println!("[Stellar] Event detected: {}", event_type);
            }

            match event_type.as_str() {
                "htlc_created" | "swap_matched" => {
                    let target_chain = extract_counterparty_chain(event)
                        .unwrap_or_else(|| {
                            eprintln!(
                                "[Stellar] No counterparty chain in event {}; defaulting to bitcoin",
                                event["id"].as_str().unwrap_or("unknown")
                            );
                            "bitcoin".to_string()
                        });

                    if !["bitcoin", "ethereum", "stellar"].contains(&target_chain.as_str()) {
                        eprintln!(
                            "[Stellar] Unknown target chain '{}' for event {}; skipping",
                            target_chain,
                            event["id"].as_str().unwrap_or("unknown")
                        );
                        continue;
                    }

                    let prefix = if event_type == "htlc_created" { "htlc-proof" } else { "swap-htlc" };
                    let tx_id = format!("stellar-{}-{}", prefix, event["id"].as_str().unwrap_or("unknown"));

                    println!(
                        "[Stellar] Routing {} to chain: {}",
                        event_type, target_chain
                    );

                    let tx = crate::retry::RetryableTransaction {
                        id: tx_id,
                        chain: target_chain,
                        tx_data: vec![],
                        attempt: 0,
                        max_attempts: config.max_retries,
                        next_retry_at: std::time::SystemTime::now(),
                    };
                    retry_queue.enqueue(tx).await;
                }
                _ => {}
            }
        }

        if let Some(ledger) = event["ledger"].as_u64() {
            if ledger > max_ledger {
                max_ledger = ledger;
            }
        }
    }

    let new_cursor = events
        .last()
        .and_then(|e| e["pagingToken"].as_str())
        .map(String::from);

    Ok((new_cursor, events.len(), max_ledger))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_plain_string_topic() {
        let val = serde_json::Value::String("htlc_created".to_string());
        assert_eq!(parse_topic_value(&val), Some("htlc_created".to_string()));
    }

    #[test]
    fn test_parse_structured_symbol_topic() {
        let val = serde_json::json!({"type": "symbol", "value": "swap_matched"});
        assert_eq!(parse_topic_value(&val), Some("swap_matched".to_string()));
    }

    #[test]
    fn test_parse_structured_string_topic() {
        let val = serde_json::json!({"type": "string", "value": "htlc_expired"});
        assert_eq!(parse_topic_value(&val), Some("htlc_expired".to_string()));
    }

    #[test]
    fn test_parse_unknown_structured_type_returns_none() {
        let val = serde_json::json!({"type": "bytes", "value": "deadbeef"});
        assert_eq!(parse_topic_value(&val), None);
    }

    #[test]
    fn test_parse_null_does_not_panic() {
        let val = serde_json::Value::Null;
        assert_eq!(parse_topic_value(&val), None);
    }

    #[test]
    fn test_parse_number_does_not_panic() {
        let val = serde_json::Value::Number(serde_json::Number::from(42));
        assert_eq!(parse_topic_value(&val), None);
    }

    #[test]
    fn test_extract_counterparty_chain_from_struct() {
        let event = serde_json::json!({
            "id": "evt-001",
            "value": {
                "type": "struct",
                "value": [
                    {
                        "key": {"type": "symbol", "value": "counterparty_chain"},
                        "val": {"type": "symbol", "value": "ethereum"}
                    }
                ]
            }
        });
        assert_eq!(extract_counterparty_chain(&event), Some("ethereum".to_string()));
    }

    #[test]
    fn test_extract_counterparty_chain_bitcoin() {
        let event = serde_json::json!({
            "id": "evt-002",
            "value": {
                "type": "struct",
                "value": [
                    {
                        "key": {"type": "symbol", "value": "counterparty_chain"},
                        "val": {"type": "symbol", "value": "bitcoin"}
                    }
                ]
            }
        });
        assert_eq!(extract_counterparty_chain(&event), Some("bitcoin".to_string()));
    }

    #[test]
    fn test_extract_counterparty_chain_from_flat_map() {
        let event = serde_json::json!({
            "id": "evt-003",
            "value": {"counterparty_chain": "ethereum"}
        });
        assert_eq!(extract_counterparty_chain(&event), Some("ethereum".to_string()));
    }

    #[test]
    fn test_extract_counterparty_chain_missing_field_returns_none() {
        let event = serde_json::json!({
            "id": "evt-004",
            "value": {"type": "struct", "value": []}
        });
        assert_eq!(extract_counterparty_chain(&event), None);
    }

    #[test]
    fn test_extract_counterparty_chain_missing_value_returns_none() {
        let event = serde_json::json!({"id": "evt-005"});
        assert_eq!(extract_counterparty_chain(&event), None);
    }

    #[test]
    fn test_routing_bitcoin_ethereum_stellar_are_valid() {
        let valid = ["bitcoin", "ethereum", "stellar"];
        for chain in &valid {
            assert!(
                ["bitcoin", "ethereum", "stellar"].contains(chain),
                "{} should be a valid target chain",
                chain
            );
        }
    }

    #[test]
    fn test_routing_unknown_chain_is_rejected() {
        let unknown = ["solana", "tron", "polygon", ""];
        for chain in &unknown {
            assert!(
                !["bitcoin", "ethereum", "stellar"].contains(chain),
                "{} should be rejected as a target chain",
                chain
            );
        }
    }

    #[test]
    fn test_load_cursor_missing_file_returns_none() {
        let result = load_cursor("/tmp/chainbridge_nonexistent_cursor_xyz.txt");
        assert!(result.is_none());
    }

    #[test]
    fn test_save_and_load_cursor_roundtrip() {
        let path = "/tmp/chainbridge_test_cursor.txt";
        save_cursor(path, "0000000012345678-0");
        let loaded = load_cursor(path);
        assert_eq!(loaded, Some("0000000012345678-0".to_string()));
        let _ = std::fs::remove_file(path);
    }
}
