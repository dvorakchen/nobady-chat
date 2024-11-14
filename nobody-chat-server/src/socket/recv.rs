use crate::cipher::SplitedDecrypt;
use axum::extract::ws::Message;
use base64::prelude::*;
use futures_util::{ready, stream::Stream};
use std::pin::Pin;

pub struct RecvSocket<S: Stream<Item = Result<Message, axum::Error>> + Unpin, C: SplitedDecrypt> {
    cipher: C,
    socket: S,
}

impl<S: Stream<Item = Result<Message, axum::Error>> + Unpin, C: SplitedDecrypt> RecvSocket<S, C> {
    pub fn new(recv_socket: S, decrytp: C) -> Self {
        Self {
            cipher: decrytp,
            socket: recv_socket,
        }
    }
}

impl<S: Stream<Item = Result<Message, axum::Error>> + std::marker::Unpin, C: SplitedDecrypt> Stream
    for RecvSocket<S, C>
{
    type Item = S::Item;

    fn poll_next(
        mut self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Option<Self::Item>> {
        let soc = Pin::new(&mut self.socket);

        let res = ready!(Stream::poll_next(soc, cx));
        if let Some(Ok(Message::Text(cipher_text))) = &res {
            let cipher_text = BASE64_STANDARD.decode(cipher_text).unwrap();
            let plain_text = self.cipher.decrypt(&cipher_text);

            return std::task::Poll::Ready(Some(Ok(Message::Text(
                String::from_utf8(plain_text).expect("cannot decode to plain text"),
            ))));
        } else {
            return std::task::Poll::Ready(res);
        }
    }
}

#[cfg(test)]
mod test_recv_socket_stream {
    use super::*;
    use async_stream::stream;
    use axum::Error;
    use futures_util::{pin_mut, StreamExt};

    #[tokio::test(flavor = "multi_thread")]
    async fn stream() {
        const EXPECTED_TEXT: &str = "text";
        const EXPECTED_TEXT_2: &str = "plain text";
        struct Cipher;
        impl SplitedDecrypt for Cipher {
            fn decrypt(&self, data: &[u8]) -> Vec<u8> {
                data.to_vec()
            }
        }

        let socket = stream! {
            yield Result::<Message, Error>::Ok(Message::Text(BASE64_STANDARD.encode(EXPECTED_TEXT)));
            yield Result::<Message, Error>::Ok(Message::Text(BASE64_STANDARD.encode(EXPECTED_TEXT)));
            yield Result::<Message, Error>::Ok(Message::Text(BASE64_STANDARD.encode(EXPECTED_TEXT)));
            yield Result::<Message, Error>::Ok(Message::Text(BASE64_STANDARD.encode(EXPECTED_TEXT_2)));
            yield Result::<Message, Error>::Ok(Message::Text(BASE64_STANDARD.encode(EXPECTED_TEXT_2)));
        };

        pin_mut!(socket);

        let mut recv_socket = RecvSocket {
            cipher: Cipher,
            socket,
        };

        if let Some(Ok(Message::Text(text))) = recv_socket.next().await {
            assert_eq!(text, EXPECTED_TEXT);
        } else {
            assert!(false);
        }
        if let Some(Ok(Message::Text(text))) = recv_socket.next().await {
            assert_eq!(text, EXPECTED_TEXT);
        } else {
            assert!(false);
        }
        if let Some(Ok(Message::Text(text))) = recv_socket.next().await {
            assert_eq!(text, EXPECTED_TEXT);
        } else {
            assert!(false);
        }
        if let Some(Ok(Message::Text(text))) = recv_socket.next().await {
            assert_eq!(text, EXPECTED_TEXT_2);
        } else {
            assert!(false);
        }
        if let Some(Ok(Message::Text(text))) = recv_socket.next().await {
            assert_eq!(text, EXPECTED_TEXT_2);
        } else {
            assert!(false);
        }
        assert!(recv_socket.next().await.is_none());
    }
}
