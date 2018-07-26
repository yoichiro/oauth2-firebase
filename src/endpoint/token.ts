import * as functions from "firebase-functions";
import {DefaultClientCredentialFetcherProvider, TokenEndpoint} from "oauth2-nodejs";
import {RequestWrapper} from "../models";
import {CustomGrantHandlerProvider} from "../granttype";
import {CloudFirestoreDataHandlerFactory} from "../data";

export function token() {
  return functions.https.onRequest(async (req, resp) => {
    if (req.method === "POST") {
      const request = new RequestWrapper(req)
      const tokenEndpoint = new TokenEndpoint()
      const clientCredentialFetcherProvider = new DefaultClientCredentialFetcherProvider()
      tokenEndpoint.grantHandlerProvider = new CustomGrantHandlerProvider(clientCredentialFetcherProvider)
      tokenEndpoint.clientCredentialFetcherProvider = clientCredentialFetcherProvider
      tokenEndpoint.dataHandlerFactory = new CloudFirestoreDataHandlerFactory()
      try {
        const tokenEndpointResponse = await tokenEndpoint.handleRequest(request);
        resp.set("Content-Type", "application/json; charset=UTF-8")
        resp.status(tokenEndpointResponse.code).send(tokenEndpointResponse.body)
      } catch(e) {
        console.error(e)
        resp.status(500).send(e.toString())
      }
    } else {
      resp.status(405).send("Method not allowed")
    }
  })
}
