use std::sync::Arc;

use super::{EncryptDecrypt, SplitedDecrypt, SplitedEncrypt};
use chacha20poly1305::{
    aead::{generic_array::GenericArray, Aead, KeyInit},
    ChaCha20Poly1305, ChaChaPoly1305, Nonce,
};
use typenum::consts::U32;

const DEFAULT_NONCE: [u8; 12] = [0u8; 12];

pub struct ChaCha {
    nonce: Nonce,
    cipher: ChaCha20Poly1305,
}

impl ChaCha {
    pub fn new(pri_key: [u8; 32]) -> Self {
        let key: GenericArray<u8, U32> = GenericArray::from(pri_key);
        let nonce = GenericArray::from(DEFAULT_NONCE);

        Self {
            nonce,
            cipher: ChaChaPoly1305::new(&key),
        }
    }
}

impl EncryptDecrypt for ChaCha {
    fn encrypt(&self, data: &[u8]) -> Vec<u8> {
        self.cipher.encrypt(&self.nonce, data).unwrap()
    }

    fn decrypt(&self, data: &[u8]) -> Vec<u8> {
        self.cipher.decrypt(&self.nonce, data).unwrap()
    }

    fn split(self) -> (impl SplitedEncrypt, impl SplitedDecrypt) {
        let encrypt = ChaChaEncrypt {
            cipher: Arc::new(self),
        };
        let decrypt = ChaChaDecrypt {
            cipher: Arc::clone(&encrypt.cipher),
        };

        (encrypt, decrypt)
    }
}

pub struct ChaChaEncrypt {
    cipher: Arc<ChaCha>,
}

impl SplitedEncrypt for ChaChaEncrypt {
    fn encrypt(&self, data: &[u8]) -> Vec<u8> {
        self.cipher.encrypt(data)
    }
}

pub struct ChaChaDecrypt {
    cipher: Arc<ChaCha>,
}

impl SplitedDecrypt for ChaChaDecrypt {
    fn decrypt(&self, data: &[u8]) -> Vec<u8> {
        self.cipher.decrypt(data)
    }
}

#[cfg(test)]
mod encrypt_decrypt_tests {
    use super::*;

    const KEY: [u8; 32] = [
        31, 41, 178, 54, 51, 219, 184, 199, 119, 92, 32, 182, 142, 56, 170, 37, 159, 220, 98, 255,
        33, 250, 116, 68, 25, 120, 81, 50, 105, 5, 104, 114,
    ];

    #[test]
    fn test_encrypt() {
        const EXPECTED_PLAIN_TEXT: &[u8; 17] = b"plaintext message";
        const EXPECTED_CIPHER_TEXT: [u8; 33] = [
            87, 54, 19, 204, 65, 207, 45, 72, 252, 182, 26, 148, 68, 79, 55, 156, 219, 213, 104,
            34, 223, 84, 92, 102, 51, 20, 236, 84, 237, 247, 97, 67, 200,
        ];

        let chacha = ChaCha::new(KEY);
        let cipher_text = chacha.encrypt(EXPECTED_PLAIN_TEXT.as_ref());

        let len = cipher_text
            .iter()
            .zip(&EXPECTED_CIPHER_TEXT)
            .filter(|&(a, b)| a == b)
            .count();

        assert_eq!(len, cipher_text.len());
        assert_eq!(len, EXPECTED_CIPHER_TEXT.len());
    }

    #[test]
    fn test_decript() {
        const EXPECTED_CIPHER_TEXT: [u8; 33] = [
            87, 54, 19, 204, 65, 207, 45, 72, 252, 182, 26, 148, 68, 79, 55, 156, 219, 213, 104,
            34, 223, 84, 92, 102, 51, 20, 236, 84, 237, 247, 97, 67, 200,
        ];

        const EXPECTED_PLAIN_TEXT: &[u8; 17] = b"plaintext message";

        let chacha = ChaCha::new(KEY);
        let plain_text = chacha.decrypt(&EXPECTED_CIPHER_TEXT);

        let len = plain_text
            .iter()
            .zip(EXPECTED_PLAIN_TEXT)
            .filter(|&(a, b)| a == b)
            .count();

        assert_eq!(len, plain_text.len());
        assert_eq!(len, EXPECTED_PLAIN_TEXT.len());
    }
}

#[cfg(test)]
mod split_tests {
    use super::*;

    const KEY: [u8; 32] = [
        31, 41, 178, 54, 51, 219, 184, 199, 119, 92, 32, 182, 142, 56, 170, 37, 159, 220, 98, 255,
        33, 250, 116, 68, 25, 120, 81, 50, 105, 5, 104, 114,
    ];

    #[test]
    fn split_into() {
        const EXPECTED_PLAIN_TEXT: &[u8; 17] = b"plaintext message";
        const EXPECTED_CIPHER_TEXT: [u8; 33] = [
            87, 54, 19, 204, 65, 207, 45, 72, 252, 182, 26, 148, 68, 79, 55, 156, 219, 213, 104,
            34, 223, 84, 92, 102, 51, 20, 236, 84, 237, 247, 97, 67, 200,
        ];

        let chacha = ChaCha::new(KEY);
        let (encrypt, decrypt) = chacha.split();

        let cipher_text = encrypt.encrypt(EXPECTED_PLAIN_TEXT);

        let count = cipher_text
            .iter()
            .zip(&EXPECTED_CIPHER_TEXT)
            .filter(|&(a, b)| a == b)
            .count();
        assert_eq!(count, cipher_text.len());
        assert_eq!(count, EXPECTED_CIPHER_TEXT.len());

        let plain_text = decrypt.decrypt(&EXPECTED_CIPHER_TEXT);

        let count = plain_text
            .iter()
            .zip(EXPECTED_PLAIN_TEXT)
            .filter(|&(a, b)| a == b)
            .count();
        assert_eq!(count, plain_text.len());
        assert_eq!(count, EXPECTED_PLAIN_TEXT.len());
    }
}
