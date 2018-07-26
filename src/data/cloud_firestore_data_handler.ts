import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as firestore from "@google-cloud/firestore";
import * as url from "url";
import {AccessToken, AuthInfo, DataHandler, Request} from "oauth2-nodejs";
const secureRandomString = require("secure-random-string");

admin.initializeApp(functions.config().firebase)

export class CloudFirestoreDataHandler implements DataHandler {

  private _request: Request

  constructor(request: Request) {
    this._request = request
  }

  getRequest(): Request {
    return this._request
  }

  async createOrUpdateAccessToken(authInfo: AuthInfo, grantType: string): Promise<AccessToken | undefined> {
    const db = admin.firestore()
    const token = secureRandomString({length: 128})
    // TODO: Load expiration length from configuration.
    const expiresIn = grantType === "implicit" ? 3600 : 86400
    const createdOn = Date.now()
    const data = {
      auth_info_id: authInfo.id,
      token: token,
      expires_in: expiresIn,
      created_on: createdOn
    }
    await db.collection("access_tokens").add(data)
    const result = new AccessToken()
    result.authId = authInfo.id
    result.expiresIn = expiresIn
    result.createdOn = createdOn
    result.token = token
    return result
  }

  async createOrUpdateAuthInfo(clientId: string, userId: string, scope?: string): Promise<AuthInfo | undefined> {
    // TODO: Check the scope
    const db = admin.firestore()
    let queryRef = db.collection("auth_infos").where("client_id", "==", clientId).where("user_id", "==", userId)
    if (scope) {
      scope.split(" ").forEach(s => {
        queryRef = queryRef.where(`client_id.${s}`, "==", true)
      })
    }
    const snapshot = await queryRef.get()
    const code = secureRandomString({length: 64})
    if (snapshot.empty) {
      const refreshToken = secureRandomString()
      const data = {
        user_id: userId,
        client_id: clientId,
        scope: scope ? scope.split(" ").reduce((a: {[key: string]: boolean}, c: string) => {a[c] = true; return a;}, {}) : {},
        refresh_token: refreshToken,
        code: code
      }
      const authInfoRef = await db.collection("auth_infos").add(data)
      const result = new AuthInfo()
      result.id = authInfoRef.id
      result.userId = userId
      result.clientId = clientId
      result.refreshToken = refreshToken
      result.code = code
      if (scope) {
        result.scope = scope
      }
      return result
    } else {
      // TODO: Check the size of the docs
      const authInfo = snapshot.docs[0]
      await db.collection("auth_infos").doc(authInfo.id).update({
        code: code
      })
      const result = new AuthInfo()
      result.id = authInfo.id
      result.userId = authInfo.get("user_id")
      result.clientId = authInfo.get("client_id")
      result.refreshToken = authInfo.get("refresh_token")
      result.code = code
      const scopes = Object.keys(authInfo.get("scope"))
      if (scopes.length > 0) {
        result.scope = scopes.join(" ")
      }
      return result
    }
  }

  private async findAuthInfo(fieldName: string, fieldValue: string): Promise<AuthInfo | undefined> {
    const db = admin.firestore()
    const queryRef = db.collection("auth_infos").where(fieldName, "==", fieldValue)
    const snapshot = await queryRef.get()
    if (snapshot.empty) {
      return undefined
    } else {
      // TODO: Check the size of the docs
      const authInfo = snapshot.docs[0]
      return this.convertAuthInfo(authInfo)
    }
  }

  private convertAuthInfo(authInfo: firestore.DocumentSnapshot): AuthInfo {
    const result = new AuthInfo()
    result.id = authInfo.id
    result.userId = authInfo.get("user_id")
    result.clientId = authInfo.get("client_id")
    result.refreshToken = authInfo.get("refresh_token")
    const scopes = Object.keys(authInfo.get("scope"))
    if (scopes.length > 0) {
      result.scope = scopes.join(" ")
    }
    return result
  }

  async getClientUserId(clientId: string, clientSecret: string): Promise<string | undefined> {
    const db = admin.firestore()
    const client = await db.collection("clients").doc(clientId).get()
    if (client.exists) {
      return client.get("user_id")
    }
    return undefined
  }

  async validateClient(clientId: string, clientSecret: string, grantType: string): Promise<boolean> {
    const db = admin.firestore()
    const client = await db.collection("clients").doc(clientId).get()
    if (client.exists) {
      // TODO: Check the client status and/or etc.
      return client.get(`grant_type.${grantType}`) && client.get("client_secret") === clientSecret
    }
    return false
  }

  async validateClientById(clientId: string): Promise<boolean> {
    const db = admin.firestore()
    const client = await db.collection("clients").doc(clientId).get()
    if (client.exists) {
      // TODO: Check the client status and/or etc.
      return true
    }
    return false
  }

  async validateClientForAuthorization(clientId: string, responseType: string): Promise<boolean> {
    const db = admin.firestore()
    const client = await db.collection("clients").doc(clientId).get()
    if (client.exists) {
      return responseType.split(" ").every((value: string): boolean => {
        return client.get(`response_type.${value}`)
      })
    }
    return false
  }

  async validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
    const db = admin.firestore()
    const client = await db.collection("clients").doc(clientId).get()
    if (client.exists) {
      const registeredRedirectUri = client.get("redirect_uri")
      const validRedirectUrl = url.parse(registeredRedirectUri)
      const redirectUrl = url.parse(redirectUri)
      return (validRedirectUrl.protocol === redirectUrl.protocol) &&
        (validRedirectUrl.host === redirectUrl.host) &&
        (validRedirectUrl.pathname === redirectUrl.pathname)
    }
    return false
  }

  async validateScope(clientId: string, scope?: string): Promise<boolean> {
    if (scope) {
      const db = admin.firestore()
      const client = await db.collection("clients").doc(clientId).get()
      if (client.exists) {
        return client.get(`scope.${scope}`)
      }
      return false
    } else {
      return false
    }
  }

  async getAccessToken(token: string): Promise<AccessToken | undefined> {
    const db = admin.firestore()
    const queryRef = await db.collection("access_tokens").where("token", "==", token)
    const snapshot = await queryRef.get()
    if (snapshot.empty) {
      return undefined
    } else {
      // TODO: Check the size of the docs
      const accessToken = snapshot.docs[0]
      const result = new AccessToken()
      result.authId = accessToken.get("auth_info_id")
      result.expiresIn = accessToken.get("expires_in")
      result.createdOn = accessToken.get("created_on")
      result.token = accessToken.get("token")
      return result
    }
  }

  async getAuthInfoByRefreshToken(refreshToken: string): Promise<AuthInfo | undefined> {
    return await this.findAuthInfo("refresh_token", refreshToken)
  }

  async getAuthInfoByCode(code: string): Promise<AuthInfo | undefined> {
    return await this.findAuthInfo("code", code)
  }

  async getAuthInfoById(id: string): Promise<AuthInfo | undefined> {
    const db = admin.firestore()
    const authInfo = await db.collection("auth_infos").doc(id).get()
    if (authInfo.exists) {
      return this.convertAuthInfo(authInfo)
    } else {
      return undefined
    }
  }

  async validateUserById(userId: string): Promise<boolean> {
    const auth = admin.auth()
    try {
      const user = await auth.getUser(userId)
      if (user) {
        return true
      }
    } catch(e) {
      console.log("e", e)
    }
    return false
  }

  async getUserId(username: string, password: string): Promise<string | undefined> {
    throw new Error("Not implemented")
  }

}
