declare module 'crypto-browserify' {
  export interface Hash {
    update(data: string | Buffer): Hash;
    digest(encoding: 'hex' | 'base64'): string;
    digest(): Buffer;
  }

  export interface Hmac {
    update(data: string | Buffer): Hmac;
    digest(encoding: 'hex' | 'base64'): string;
    digest(): Buffer;
  }

  export interface CryptoAPI {
    createHash(algorithm: string): Hash;
    createHmac(algorithm: string, key: string | Buffer): Hmac;
    randomBytes(size: number): Buffer;
    createCipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
    createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
    pbkdf2Sync(password: string, salt: Buffer, iterations: number, keylen: number, digest: string): Buffer;
  }

  const crypto: CryptoAPI;
  export = crypto;
}