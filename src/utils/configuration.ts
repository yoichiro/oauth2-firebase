export interface ConfigurationParameters {
  crypto_auth_token_secret_key_32: string
  views_path?: string
}

export class Configuration {

  private static _instance: Configuration

  private _crypto_auth_token_secret_key_32: string | undefined
  private _views_path: string | undefined

  private constructor() {
  }

  public static get instance(): Configuration {
    if (this._instance == undefined) {
      this._instance = new Configuration()
    }
    return this._instance
  }

  public static init(params: ConfigurationParameters): void {
    this.instance._crypto_auth_token_secret_key_32 = params.crypto_auth_token_secret_key_32
    this.instance._views_path = params.views_path
  }

  public get crypto_auth_token_secret_key_32(): string {
    if (this._crypto_auth_token_secret_key_32) {
      return this._crypto_auth_token_secret_key_32
    } else {
      throw new Error("crypto_auth_token_secret_key_32 not set")
    }
  }

  get views_path(): string {
    if (this._views_path) {
      return this._views_path
    } else {
      return __dirname + "/../../views"
    }
  }

}
