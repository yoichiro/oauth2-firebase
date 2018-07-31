import * as functions from "firebase-functions";
import {TokeninfoEndpoint} from "oauth2-nodejs";
import {RequestWrapper} from "../models";
import {CloudFirestoreDataHandlerFactory} from "../data";

export function tokeninfo() {
  return functions.https.onRequest(async (req, resp) => {
    if (req.method === "GET") {
      const request = new RequestWrapper(req)
      const tokeninfoEndpoint = new TokeninfoEndpoint()
      tokeninfoEndpoint.dataHandlerFactory = new CloudFirestoreDataHandlerFactory()
      try {
        const tokeninfoEndpointResponse = await tokeninfoEndpoint.handleRequest(request);
        resp.set("Content-Type", "application/json; charset=UTF-8")
        resp.status(tokeninfoEndpointResponse.code).send(tokeninfoEndpointResponse.body)
      } catch(e) {
        console.error(e)
        resp.status(500).send(e.toString())
      }
    } else {
      resp.status(405).send("Method not allowed")
    }
  })
}
