import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {AccessDenied, DefaultAccessTokenFetcherProvider, ProtectedResourceEndpoint, UnknownError} from "oauth2-nodejs";
import {RequestWrapper} from "../models";
import {CloudFirestoreDataHandlerFactory} from "../data";
import {Navigation} from "../utils";

export function userinfo() {
  return functions.https.onRequest(async (req, resp) => {
    const request = new RequestWrapper(req)
    const protectedResourceEndpoint = new ProtectedResourceEndpoint()
    protectedResourceEndpoint.accessTokenFetcherProvider = new DefaultAccessTokenFetcherProvider()
    protectedResourceEndpoint.dataHandlerFactory = new CloudFirestoreDataHandlerFactory()
    const result = await protectedResourceEndpoint.handleRequest(request)
    if (result.isSuccess()) {
      // ProtectedResourceEndpointResponse
      const response = result.value
      if (response.scope.split(" ").indexOf("profile") !== -1) {
        resp.set("Content-Type", "application/json; charset=UTF-8")
        const auth = admin.auth()
        try {
          const userRecord = await auth.getUser(response.userId)
          resp.status(200).send(JSON.stringify({"sub": response.userId, name: userRecord.displayName}))
        } catch(e) {
          Navigation.sendError(resp, new UnknownError(e.toString()))
        }
      } else {
        Navigation.sendError(resp, new AccessDenied(""))
      }
    } else {
      Navigation.sendError(resp, result.error)
    }
  })
}
