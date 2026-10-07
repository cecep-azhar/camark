//! Generic Pro Licensing & Account client.

use crate::error::CatermError;
use ed25519_dalek::VerifyingKey;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProStatus {
    pub is_pro: bool,
    pub plan: String,
    pub email: Option<String>,
    pub expires_at: Option<String>,
}

/// Aligned Ed25519 GCC Pro license public key
pub fn public_key(version: u32) -> Option<VerifyingKey> {
    let compiled = match version {
        1 => option_env!("CMRK_PRO_LICENSE_PUBKEY_V1").or(Some(
            "4aed277ac7b92ee58778d3c5233ebda741c652c753e3dae7127f367dbb58d92f",
        )),
        2 => option_env!("CMRK_PRO_LICENSE_PUBKEY_V2"),
        _ => None,
    };
    #[cfg(debug_assertions)]
    let runtime = std::env::var("CMRK_PRO_LICENSE_PUBKEY").ok();
    #[cfg(not(debug_assertions))]
    let runtime: Option<String> = None;

    let hex_key = compiled.map(str::to_string).or(runtime)?;
    let bytes: [u8; 32] = hex::decode(hex_key.trim()).ok()?.try_into().ok()?;
    VerifyingKey::from_bytes(&bytes).ok()
}

pub fn get_pro_status() -> Result<ProStatus, CatermError> {
    Ok(ProStatus {
        is_pro: false,
        plan: "free".to_string(),
        email: None,
        expires_at: None,
    })
}
