use crate::cipher::SplitedEncrypt;
use axum::extract::ws::{Message, WebSocket};
use base64::prelude::*;
use futures_util::{stream::SplitSink, SinkExt};

pub trait SendMsg {
    async fn send(&mut self, msg: String) -> Result<(), axum::Error>;
    async fn close(&mut self);
}

pub struct SinkSendMsg(pub SplitSink<WebSocket, Message>);

impl SendMsg for SinkSendMsg {
    async fn send(&mut self, msg: String) -> Result<(), axum::Error> {
        self.0.send(Message::Text(msg)).await
    }

    async fn close(&mut self) {
        self.0.close().await.unwrap();
    }
}

pub struct SendSocket<S: SendMsg> {
    cipher: Box<dyn SplitedEncrypt>,
    socket: S,
}

impl<S: SendMsg> SendSocket<S> {
    #[allow(dead_code)]
    pub fn new(socket: S, encrypt: impl SplitedEncrypt + 'static) -> Self {
        Self {
            cipher: Box::new(encrypt),
            socket,
        }
    }

    pub async fn send(&mut self, text: String) -> Result<(), axum::Error> {
        let cipher_text = self.cipher.encrypt(text.as_ref());
        let cipher_text = BASE64_STANDARD.encode(cipher_text);
        self.socket.send(cipher_text).await
    }

    pub async fn close(&mut self) {
        self.socket.close().await;
    }
}

impl SendSocket<SinkSendMsg> {
    pub fn with_split_sink(
        sink: SplitSink<WebSocket, Message>,
        encrypt: impl SplitedEncrypt + 'static,
    ) -> Self {
        Self {
            socket: SinkSendMsg(sink),
            cipher: Box::new(encrypt),
        }
    }
}

#[cfg(test)]
mod test_send_socket {

    use super::*;
    use mockall::predicate::*;
    use mockall::*;

    mock! {
        pub MySink{}

        impl SendMsg for MySink {
            async fn send(&mut self, msg: String) -> Result<(), axum::Error>;
            async fn close(&mut self);
        }
    }

    mock! {
        pub MyCipher{}

        impl SplitedEncrypt for MyCipher {
            fn encrypt(&self, data: &[u8]) -> Vec<u8>;
        }
    }

    #[tokio::test]
    async fn send_test() {
        const EXPECTED_PLAIN_TEXT: &str = "plain text";

        let mut mock_sink = MockMySink::new();
        mock_sink.expect_send().returning(|msg| {
            // result_data = msg;
            if msg == BASE64_STANDARD.encode(EXPECTED_PLAIN_TEXT) {
                Ok(())
            } else {
                Err(axum::Error::new(""))
            }
        });

        let mut mock_cipher = MockMyCipher::new();
        mock_cipher.expect_encrypt().returning(|data| data.to_vec());

        let mut socket = SendSocket::new(mock_sink, mock_cipher);
        let res = socket.send(EXPECTED_PLAIN_TEXT.to_string()).await;
        assert!(res.is_ok());
    }
}
