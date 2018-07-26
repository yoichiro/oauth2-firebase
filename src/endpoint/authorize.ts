import * as functions from "firebase-functions";
import * as express from "express";
import {RequestMap, RequestWrapper} from "../models";
import {AuthorizationEndpoint} from "oauth2-nodejs";
import {CloudFirestoreDataHandlerFactory, CloudFirestoreScopes, CloudFirestoreClients} from "../data";
import {Configuration, Crypto, Navigation} from "../utils";

const authorizeApp = express()

authorizeApp.set("views", Configuration.instance.views_path)

authorizeApp.get("/entry", async (req, resp) => {
  const request = new RequestWrapper(req)
  const authorizationEndpoint = new AuthorizationEndpoint()
  authorizationEndpoint.dataHandlerFactory = new CloudFirestoreDataHandlerFactory()
  authorizationEndpoint.allowedResponseTypes = ["code", "token"]
  try {
    const authorizationEndpointResponse = await authorizationEndpoint.handleRequest(request)
    if (authorizationEndpointResponse.isSuccess()) {

      const authToken: {[key: string]: string | number} = {
        "client_id": request.getParameter("client_id")!,
        "redirect_uri": request.getParameter("redirect_uri")!,
        "response_type": request.getParameter("response_type")!,
        "scope": request.getParameter("scope")!,
        "created_at": Date.now()
      }
      const state = request.getParameter("state")
      if (state) {
        authToken["state"] = state
      }
      const authTokenString = Crypto.encrypt(JSON.stringify(authToken))
      Navigation.redirect(resp, "/authentication/", {"auth_token": authTokenString})
    } else {
      const error = authorizationEndpointResponse.error
      resp.set("Content-Type", "application/json; charset=UTF-8")
      resp.status(error.code).send(error.toJson())
    }
  } catch(e) {
    console.error(e)
    resp.status(500).send(e.toString())
  }
})

authorizeApp.get("/consent", async (req, resp) => {
  const request = new RequestWrapper(req)
  const encryptedAuthToken = request.getParameter("auth_token")!
  const authToken = JSON.parse(Crypto.decrypt(encryptedAuthToken))
  const client = await CloudFirestoreClients.fetch(authToken["client_id"])
  const encryptedUserId = request.getParameter("user_id")!
  const scopes = await CloudFirestoreScopes.fetch()
  resp.render("consent.ejs", {
    authToken,
    encryptedAuthToken,
    encryptedUserId,
    scopes,
    client
  })
})

authorizeApp.post("/consent", async (req, resp) => {
  const requestWrapper = new RequestWrapper(req)
  const encryptedAuthToken = requestWrapper.getParameter("auth_token")!
  const authToken = JSON.parse(Crypto.decrypt(encryptedAuthToken))
  const encryptedUserId = requestWrapper.getParameter("user_id")!
  const userId = Crypto.decrypt(encryptedUserId)
  const requestMap = new RequestMap()
  requestMap.setParameter("user_id", userId)
  requestMap.setParameter("state", authToken["state"])
  requestMap.setParameter("client_id", authToken["client_id"])
  requestMap.setParameter("redirect_uri", authToken["redirect_uri"])
  requestMap.setParameter("response_type", authToken["response_type"])
  requestMap.setParameter("scope", authToken["scope"])
  const authorizationEndpoint = new AuthorizationEndpoint()
  authorizationEndpoint.dataHandlerFactory = new CloudFirestoreDataHandlerFactory()
  authorizationEndpoint.allowedResponseTypes = ["code", "token"]
  const action = requestWrapper.getParameter("action")
  if (action === "allow") {
    Navigation.backTo(resp, await authorizationEndpoint.allow(requestMap), authToken["redirect_uri"])
  } else {
    Navigation.backTo(resp, await authorizationEndpoint.deny(requestMap), authToken["redirect_uri"])
  }
})

export function authorize() {
  return functions.https.onRequest(authorizeApp)
}
