import { ChaCha20Poly1305 } from '@stablelib/chacha20poly1305'

export interface CipherBuilder {
  build(secretKey: Uint8Array): Cipher
}

export class ChaChaBuilder implements CipherBuilder {
  build(secretKey: Uint8Array): Cipher {
    return new ChaCha(secretKey)
  }
}

export interface Cipher {
  encrypt(plainText: string): Uint8Array
  decrypt(cipherText: Uint8Array): string
}

export class ChaCha implements Cipher {
  private nonce = Uint8Array.from(Array.from({ length: 12 }, () => 0))
  private cipher
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()

  constructor(private key: Uint8Array) {
    this.cipher = new ChaCha20Poly1305(key)
  }
  encrypt(plainText: string): Uint8Array {
    return this.cipher.seal(this.nonce, this.encoder.encode(plainText))
  }
  decrypt(cipherText: Uint8Array): string {
    const bytes = this.cipher.open(this.nonce, cipherText)!
    return this.decoder.decode(bytes)
  }
}
