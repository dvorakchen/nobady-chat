pub mod chacha;

pub trait EncryptDecrypt
where
    Self: Send + Sync,
{
    fn encrypt(&self, data: &[u8]) -> Vec<u8>;

    fn decrypt(&self, data: &[u8]) -> Vec<u8>;

    fn split(self) -> (impl SplitedEncrypt, impl SplitedDecrypt);
}

pub trait SplitedEncrypt
where
    Self: Send + Sync,
{
    fn encrypt(&self, data: &[u8]) -> Vec<u8>;
}

pub trait SplitedDecrypt: Unpin
where
    Self: Send + Sync,
{
    fn decrypt(&self, data: &[u8]) -> Vec<u8>;
}
