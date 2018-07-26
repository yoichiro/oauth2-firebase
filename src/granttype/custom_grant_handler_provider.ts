import {
  AuthorizationCodeGrantHandler,
  ClientCredentialFetcherProvider, ClientCredentialsGrantHandler,
  GrantHandler,
  GrantHandlerProvider, RefreshTokenGrantHandler
} from "oauth2-nodejs";

export class CustomGrantHandlerProvider extends GrantHandlerProvider {

  constructor(clientCredentialFetcherProvider: ClientCredentialFetcherProvider) {
    super()

    const handlers = new Map<string, GrantHandler>()

    const authorizationCode = new AuthorizationCodeGrantHandler()
    authorizationCode.clientCredentialFetcherProvider = clientCredentialFetcherProvider
    handlers.set("authorization_code", authorizationCode)

    const refreshToken = new RefreshTokenGrantHandler()
    refreshToken.clientCredentialFetcherProvider = clientCredentialFetcherProvider
    handlers.set("refresh_token", refreshToken)

    const clientCredentials = new ClientCredentialsGrantHandler()
    clientCredentials.clientCredentialFetcherProvider = clientCredentialFetcherProvider
    handlers.set("client_credentials", clientCredentials)

    this.handlers = handlers
  }

}
