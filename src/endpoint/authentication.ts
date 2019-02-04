import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as path from "path";
import {RequestWrapper} from "../models";
import {Configuration, Crypto, Navigation} from "../utils";

class AuthenticationApp {

  static create(providerName: string, scopes: string[]): express.Express {
    const authenticationApp = express()

    authenticationApp.set("views", path.join(__dirname, "../../views"))

    authenticationApp.get("/", (req, resp) => {
      const request = new RequestWrapper(req)
      const authToken = request.getParameter("auth_token")
      resp.render("authentication.ejs", {
        authToken,
        projectId: process.env.GCLOUD_PROJECT,
        projectApiKey: Configuration.instance.project_apikey,
        providerName,
        scopes
      })
    })

    authenticationApp.post("/", async (req, resp) => {
      const request = new RequestWrapper(req)
      const encryptedAuthToken = request.getParameter("auth_token")!
      const idTokenString = request.getParameter("id_token")!
      const accessTokenString = request.getParameter("access_token")!
      const providerName = request.getParameter("provider_name")!
      const success = request.getParameter("success")
      const error = request.getParameter("error")
      if (success === "true") {
        try {
          const idToken = await admin.auth().verifyIdToken(idTokenString)
          if (idToken.aud === process.env.GCLOUD_PROJECT) {
            const encryptedUserId = Crypto.encrypt(idToken.sub)
            const encryptedAccessToken = Crypto.encrypt(accessTokenString)
            Navigation.redirect(
              resp,
              "/authorize/consent",
              {
                "auth_token": encryptedAuthToken,
                "user_id": encryptedUserId,
                "access_token": encryptedAccessToken,
                "provider_name": providerName
              })
            return
          }
        } catch(e) {
          console.log("e", e)
        }
      } else {
        console.log("error", error)
      }
      const authToken = JSON.parse(Crypto.decrypt(request.getParameter("auth_token")!))
      Navigation.redirect(resp, authToken["redirect_uri"], {"error": "access_denied"})
    })

    return authenticationApp
  }

}

export function googleAccountAuthentication(scopes: string[] = []) {
  return functions.https.onRequest(AuthenticationApp.create("Google", scopes))
}

export function facebookAccountAuthentication(scopes: string[] = []) {
  return functions.https.onRequest(AuthenticationApp.create("Facebook", scopes))
}

export function githubAccountAuthentication(scopes: string[] = []) {
  return functions.https.onRequest(AuthenticationApp.create("Github", scopes))
}
