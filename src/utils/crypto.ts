import * as crypto from "crypto";
import {Configuration} from "./configuration";

export class Crypto {

  static encrypt = (text: string): string => {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(Configuration.instance.crypto_auth_token_secret_key_32, "ascii"),
      iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`
  }

  static decrypt = (text: string): string => {
    const divided = text.split(":")
    const iv = Buffer.from(divided.shift()!, "hex")
    const encrypted = Buffer.from(divided.join(":"), "hex")
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(Configuration.instance.crypto_auth_token_secret_key_32, "ascii"),
      iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

}
