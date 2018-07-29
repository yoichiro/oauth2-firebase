import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as path from "path";
import {RequestWrapper} from "../models";
import {Configuration, Crypto, Navigation} from "../utils";

class AuthenticationApp {

  static create(providerName: string): express.Express {
    const authenticationApp = express()

    authenticationApp.set("views", path.join(__dirname, "../../views"))

    authenticationApp.get("/", (req, resp) => {
      const request = new RequestWrapper(req)
      const authToken = request.getParameter("auth_token")
      resp.render("authentication.ejs", {
        authToken: authToken,
        projectId: process.env.GCLOUD_PROJECT,
        projectApiKey: Configuration.instance.project_apikey,
        providerName: providerName
      })
    })

    authenticationApp.post("/", async (req, resp) => {
      const request = new RequestWrapper(req)
      const encryptedAuthToken = request.getParameter("auth_token")!
      const idTokenString = request.getParameter("id_token")!
      const success = request.getParameter("success")
      const error = request.getParameter("error")
      if (success === "true") {
        try {
          const idToken = await admin.auth().verifyIdToken(idTokenString)
          if (idToken.aud === process.env.GCLOUD_PROJECT) {
            const encryptedUserId = Crypto.encrypt(idToken.sub)
            Navigation.redirect(resp, "/authorize/consent", {"auth_token": encryptedAuthToken, "user_id": encryptedUserId})
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

export function googleAccountAuthentication() {
  return functions.https.onRequest(AuthenticationApp.create("Google"))
}

export function facebookAccountAuthentication() {
  return functions.https.onRequest(AuthenticationApp.create("Facebook"))
}

export function githubAccountAuthentication() {
  return functions.https.onRequest(AuthenticationApp.create("Github"))
}
