import {ConsentViewTemplate} from "../endpoint/views/consent_view_template";
import {DefaultConsentViewTemplate} from "../endpoint/views/default_consent_view_template";
import * as fs from "fs";
import * as path from "path";

export interface ConfigurationParameters {
  crypto_auth_token_secret_key_32: string
  project_api_key: string
  views_consent_template?: ConsentViewTemplate
  tokens_expires_in?: Map<string, number>
  view_path?: string
}

export class Configuration {

  private static _instance: Configuration

  private _crypto_auth_token_secret_key_32: string | undefined
  private _project_apikey: string | undefined
  private _view_consent_template: ConsentViewTemplate | undefined
  private _tokens_expires_in: Map<string, number> | undefined
  private _view_path: string | undefined

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
    this.instance._project_apikey = params.project_api_key
    this.instance._view_consent_template = params.views_consent_template
    this.instance._tokens_expires_in = params.tokens_expires_in
    this.instance._view_path = params.view_path
  }

  public get crypto_auth_token_secret_key_32(): string {
    if (this._crypto_auth_token_secret_key_32) {
      return this._crypto_auth_token_secret_key_32
    } else {
      throw new Error("crypto_auth_token_secret_key_32 not set")
    }
  }

  get project_apikey(): string {
    if (this._project_apikey) {
      return this._project_apikey
    } else {
      throw new Error("project_api_key not set")
    }
  }

  get view_consent_template(): ConsentViewTemplate {
    if (this._view_consent_template) {
      return this._view_consent_template
    } else {
      return new DefaultConsentViewTemplate()
    }
  }

  get tokens_expires_in(): Map<string, number> {
    if (this._tokens_expires_in) {
      return this._tokens_expires_in
    } else {
      const result = new Map<string, number>()
      result.set("authorization_code", 86400)
      result.set("implicit", 3600)
      result.set("password", 86400)
      result.set("client_credentials", 86400)
      result.set("refresh_token", 86400)
      return result
    }
  }

  get view_path(): string {
    if(this._view_path && fs.existsSync(this._view_path)) {
      return this._view_path;
    } else {
      return path.join(__dirname, '../../views');
    }
  }

}
