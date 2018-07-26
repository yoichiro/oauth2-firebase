import * as admin from "firebase-admin";

export class Client {

  private _clientId: string
  private _providerName: string
  private _scopes: string[]
  private _responseTypes: string[]
  private _grantTypes: string[]
  private _userId: string
  private _clientSecret: string

  get clientId(): string {
    return this._clientId;
  }

  set clientId(value: string) {
    this._clientId = value;
  }

  get providerName(): string {
    return this._providerName;
  }

  set providerName(value: string) {
    this._providerName = value;
  }

  get scopes(): string[] {
    return this._scopes;
  }

  set scopes(value: string[]) {
    this._scopes = value;
  }

  get responseTypes(): string[] {
    return this._responseTypes;
  }

  set responseTypes(value: string[]) {
    this._responseTypes = value;
  }

  get grantTypes(): string[] {
    return this._grantTypes;
  }

  set grantTypes(value: string[]) {
    this._grantTypes = value;
  }

  get userId(): string {
    return this._userId;
  }

  set userId(value: string) {
    this._userId = value;
  }

  get clientSecret(): string {
    return this._clientSecret;
  }

  set clientSecret(value: string) {
    this._clientSecret = value;
  }

}

export class CloudFirestoreClients {

  public static async fetch(clientId: string): Promise<Client | undefined> {
    const db = admin.firestore()
    const client = await db.collection("clients").doc(clientId).get()
    if (client.exists) {
      const result = new Client()
      result.clientId = client.id
      result.clientSecret = client.get("client_secret")
      result.grantTypes = Object.keys(client.get("grant_type")).filter((value: string): boolean => {return client.get(`grant_type.${value}`)})
      result.responseTypes = Object.keys(client.get("response_type")).filter((value: string): boolean => {return client.get(`response_type.${value}`)})
      result.scopes = Object.keys(client.get("scope")).filter((value: string): boolean => {return client.get(`scope.${value}`)})
      result.userId = client.get("user_id")
      result.providerName = client.get("provider_name")
      return result
    } else {
      return undefined
    }
  }

}
