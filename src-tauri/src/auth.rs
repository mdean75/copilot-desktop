use keyring::Entry;
use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Emitter};

const SERVICE: &str = "copilot-desktop";
const GITHUB_TOKEN_KEY: &str = "github_access_token";

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeviceFlowStart {
    pub user_code: String,
    pub verification_uri: String,
}

#[derive(Deserialize)]
struct DeviceCodeResponse {
    device_code: Option<String>,
    user_code: Option<String>,
    verification_uri: Option<String>,
    expires_in: Option<u64>,
    interval: Option<u64>,
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

/// Starts the GitHub Device Flow: requests a device code, returns the user-facing
/// code and verification URL, then polls in a background thread. Emits
/// "auth://token-ready" with the token on success or "auth://token-error" on failure.
#[command]
pub fn start_device_auth(app: AppHandle, client_id: String) -> Result<DeviceFlowStart, String> {
    let client = Client::new();

    let resp: DeviceCodeResponse = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("scope", "read:user"),
        ])
        .send()
        .map_err(|e| e.to_string())?
        .json()
        .map_err(|e| e.to_string())?;

    if let Some(err) = resp.error {
        let msg = resp.error_description.unwrap_or(err);
        return Err(msg);
    }

    let device_code = resp.device_code.ok_or("Missing device_code in response")?;
    let user_code = resp.user_code.ok_or("Missing user_code in response")?;
    let verification_uri = resp.verification_uri.ok_or("Missing verification_uri in response")?;
    let interval = resp.interval.unwrap_or(5);
    let expires_in = resp.expires_in.unwrap_or(900);

    let start = DeviceFlowStart {
        user_code: user_code.clone(),
        verification_uri: verification_uri.clone(),
    };

    std::thread::spawn(move || {
        let client = Client::new();
        let deadline =
            std::time::Instant::now() + std::time::Duration::from_secs(expires_in);

        loop {
            std::thread::sleep(std::time::Duration::from_secs(interval));

            if std::time::Instant::now() > deadline {
                app.emit("auth://token-error", "Code expired. Please try again.").ok();
                return;
            }

            let result: Result<TokenResponse, _> = client
                .post("https://github.com/login/oauth/access_token")
                .header("Accept", "application/json")
                .form(&[
                    ("client_id", client_id.as_str()),
                    ("device_code", device_code.as_str()),
                    ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
                ])
                .send()
                .and_then(|r| r.json());

            match result {
                Ok(t) if t.access_token.is_some() => {
                    app.emit("auth://token-ready", t.access_token.unwrap()).ok();
                    return;
                }
                Ok(t) => match t.error.as_deref() {
                    Some("authorization_pending") => continue,
                    Some("slow_down") => {
                        std::thread::sleep(std::time::Duration::from_secs(5));
                        continue;
                    }
                    Some(_) => {
                        let msg = t.error_description.or(t.error).unwrap_or_default();
                        app.emit("auth://token-error", msg).ok();
                        return;
                    }
                    None => continue,
                },
                Err(e) => {
                    app.emit("auth://token-error", e.to_string()).ok();
                    return;
                }
            }
        }
    });

    Ok(start)
}

#[command]
pub fn store_token(token: String) -> Result<(), String> {
    Entry::new(SERVICE, GITHUB_TOKEN_KEY)
        .map_err(|e| e.to_string())?
        .set_password(&token)
        .map_err(|e| e.to_string())
}

#[command]
pub fn get_token() -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE, GITHUB_TOKEN_KEY).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub fn delete_token() -> Result<(), String> {
    Entry::new(SERVICE, GITHUB_TOKEN_KEY)
        .map_err(|e| e.to_string())?
        .delete_password()
        .map_err(|e| e.to_string())
}
