use axum::extract::ws::{Message, WebSocket};
use base64::{prelude::BASE64_STANDARD, Engine};
use log::debug;
use x25519_dalek::{EphemeralSecret, PublicKey, SharedSecret};

const PUB_KEY_LEN: usize = 32;

/// indicating a User who has not encrypted
pub struct PlainUser {
    socket: WebSocket,
    secret_key: EphemeralSecret,
}

impl PlainUser {
    pub fn new(socket: WebSocket) -> Self {
        debug!("new plain text");
        Self {
            socket,
            secret_key: EphemeralSecret::random(),
        }
    }

    /// encrypt the connection and into a User
    pub async fn exchange_key(mut self) -> Result<(WebSocket, SharedSecret), axum::Error> {
        let data = self
            .socket
            .recv()
            .await
            .ok_or(axum::Error::new("plain user receiving data failed"))??;

        if let Message::Text(text) = data {
            debug!("recv pub key: {}", text);
            let remote_pub_key = BASE64_STANDARD
                .decode(text)
                .map_err(|e| axum::Error::new(e.to_string()))?;

            let remote_pub_key = String::from_utf8(remote_pub_key).unwrap();
            let remote_pub_key: Vec<u8> = remote_pub_key
                .split(',')
                .map(|n| n.parse::<u8>().unwrap())
                .collect();

            if remote_pub_key.len() != PUB_KEY_LEN {
                return Err(axum::Error::new("public key wrong length"));
            }
            let mut pub_key = [0u8; PUB_KEY_LEN];
            for i in 0..PUB_KEY_LEN {
                pub_key[i] = remote_pub_key[i];
            }
            debug!("recv pub u8 key: {:?}", pub_key);
            let remote_pub_key = PublicKey::from(pub_key);

            let pub_key = PublicKey::from(&self.secret_key);
            let pub_key = pub_key.to_bytes();

            let pub_key = pub_key.map(|n| n.to_string()).join(",");

            let pub_key = BASE64_STANDARD.encode(&pub_key);
            debug!("generate local pub key: {pub_key}");
            self.socket.send(Message::Text(pub_key)).await?;

            let shared = self.secret_key.diffie_hellman(&remote_pub_key);
            debug!("shared key: {:?}", shared.as_ref());
            return Ok((self.socket, shared));
        }

        Err(axum::Error::new("received not Text"))
    }
}
