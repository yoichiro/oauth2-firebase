# oauth2-firebase

This library provides OAuth2 server implementation for Firebase. The points are:

* Supporting Google Sign-In, GitHub Login and Facebook Login to authenticate users as Federation ID provider using Firebase Authentication.
* Providing each endpoint for Cloud Functions.
* Storing information into Cloud Firestore.
* Supporting Authorization Code Grant, Implicit Grant and Client Credentials grant of OAuth 2.0.

[![NPM Version](https://img.shields.io/npm/v/oauth2-firebase.svg)](https://www.npmjs.org/package/oauth2-firebase)

# How to install

This section describes how to use this library.

## Prerequisite

You must already have some Firebase project which enables Cloud Functions, Cloud Firestore and Firebase Authentication.
Especially, it is necessary to enable the Google Sign-In or Facebook Login for Federation ID provider on the Firebase Authentication.

## Install this library

This library has been providing as JavaScript library on the npm repository. You can install this library
with the `npm` command. We represent your project directory `${PROJECT_HOME}`.

```bash
$ cd ${PROJECT_HOME}
$ cd functions
$ npm install oauth2-firebase --save
```

## Define endpoints as Cloud Functions

This library provides some endpoints for OAuth 2.0. Each endpoint is a handler function for the express.

If you use the TypeScript to write your functions, add the following code to your `functions/index.ts` file.

```
$ vi index.ts
```

The code you need to write is the following:

**Google Sign-In**

```javascript
import * as functions from "firebase-functions";
import {authorize, Configuration, googleAccountAuthentication, token, userinfo} from "oauth2-firebase";

Configuration.init({
  crypto_auth_token_secret_key_32: functions.config().crypto.auth_token_secret_key_32,
  project_api_key: functions.config().project.api_key
});

exports.token = token();
exports.authorize = authorize();
exports.authentication = googleAccountAuthentication();
exports.userinfo = userinfo();

...
```

**Facebook Login**

```javascript
import * as functions from "firebase-functions";
import {authorize, Configuration, facebookAccountAuthentication, token, userinfo} from "oauth2-firebase";

Configuration.init({
  crypto_auth_token_secret_key_32: functions.config().crypto.auth_token_secret_key_32,
  project_api_key: functions.config().project.api_key
});

exports.token = token();
exports.authorize = authorize();
exports.authentication = facebookAccountAuthentication();
exports.userinfo = userinfo();

...
```

**GitHub Login**

```javascript
import * as functions from "firebase-functions";
import {authorize, Configuration, githubAccountAuthentication, token, userinfo} from "oauth2-firebase";

Configuration.init({
  crypto_auth_token_secret_key_32: functions.config().crypto.auth_token_secret_key_32,
  project_api_key: functions.config().project.api_key
});

exports.token = token();
exports.authorize = authorize();
exports.authentication = githubAccountAuthentication();
exports.userinfo = userinfo();

...
```
 
By the code above, the following endpoints are defined:

* `https://.../token` - Token endpoint.
* `https://.../authorize` - Authorization endpoint.
* `https://.../authentication` - Login page for Google Sign-In.
* `https://.../userinfo` - Userinfo API endpoint.

## Generate a shared key

This library uses a shared key for navigating pages. You need to generate a random string for the shared key.
The string must be 32 length. For example:

```bash
$ cat /dev/urandom | base64 | fold -w 32 | head -n 1
```

## Set a configuration value to your project

After generating the random string, you need to set the string as the shared key with the following `firebase` command.

```bash
firebase functions:config:set crypto.auth_token_secret_key_32=<YOUR_GENERATED_RANDOM_STRING>
```

In addition, you need to set the API Key value of your Firebase project. You can retrieve the API Key value by the
following steps:

1. Go to the setting page of your Firebase project: `https://console.firebase.google.com/project/<YOUR_PROJECT_ID>/settings/general/`
1. Get the string of the field labeled `Web API Key`.

Then, execute the following command to register the configuration:

```bash
firebase functions:config:set project.api_key=<YOUR_API_KEY>
```

## Deploy your project

After writing the code and setting the configuration, deploy your project to the Firebase.

```bash
$ firebase deploy --only functions
```

# Register your client

In OAuth2.0, each client must be registered in advance. This library uses the Cloud Firestore as the storage
for the client definitions. In the current version, you need to register client definitions with the Firebase Console
manually. To register a client definition, add a new doc in a "clients" collection as like the following:

* Collection: `clients`
* Doc ID: Auto-generated. This will be used as a Client ID value.
* Fields:
  * `user_id` - The user ID which represents this client as a user.
  * `provider_name` - The provider name who this client provides.
  * `client_secret` - The client secret string. You need to generate this string as the shared key, and need to share the provider.
  * `redirect_uri` - If this client supports Authorization Code grant and Implicit grant, you need to set this redirect_uri string.
  * `grant_type` - This is an object. Each key represents a grant type, and each value is boolean whether the grant type is supported or not. You need to set these entries: `authorization_code`, `password`, `client_credentials` and `refresh_token`.
  * `response_type` - This is an object. Each key represents a response type, and each value is boolean whether the response type is supported or not. You need to set these entries: `code` and `token`.
  * `scope` - This is an object. Each key represents a scope, and each value is boolean whether the scope is supported or not. You need to set the entry: `profile`.

The following is a sample JSON string which represents the values above:

```json
{
  "user_id": "client@123",
  "provider_name": "Google, Inc.",
  "client_secret": "foobar123456",
  "redirect_uri": "https://foobar.com/foo/bar/baz",
  "grant_type": {
    "authorization_code": true,
    "password": false,
    "client_credentials": true,
    "refresh_token": true
  },
  "response_type": {
    "code": true,
    "token": true
  },
  "scope": {
    "profile": true
  }
}
```

# Set a description for each scope

This library shows a consent page to ask whether they allow or deny scopes. You need to register descriptions for each scope with the Firebase Console manually. To register a scope description, add a new doc in a "scopes" collection as like the following:

* Collection: `scopes`
* Doc ID: Auto-generated.
* Fields:
  * `name` - Scope name (ex. "profile").
  * `description` - Scope description (ex. "User profile information (User ID and Nickname)").

The following is a sample JSON string which represents the values above:

```json
{
  "name": "profile",
  "description": "User profile information (User ID and Nickname)"
}
```

# Customize the consent page design

This library provides a very simple design of the consent page. But, you can customize the design. For instance, you
can provide your own template string for the consent page from your code.

To customize the page design, you need to create a new class which implements the `ConsentViewTemplate` interface.
For example, the class code will be like the following:

```javascript
import {ConsentViewTemplate} from "oauth2-firebase/dist/endpoint/views/consent_view_template";

export class MyConsentViewTemplate implements ConsentViewTemplate {

  provide(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      resolve(`<!DOCTYPE html>

<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>Authorization page</title>
</head>
<body>
<p><%= providerName %> requests the following permissions:</p>
<ul>
    <% for (const key of scope.split(" ")) { %>
    <li><%= scopes.get(key) %></li>
    <% } %>
</ul>
<p>Could you allow them?</p>
<form method="post" action="/authorize/consent">
    <input type="hidden" name="auth_token" value="<%= encryptedAuthToken %>">
    <input type="hidden" name="user_id" value="<%= encryptedUserId %>">
    <button type="submit" name="action" value="allow">Allow</button>
    <button type="submit" name="action" value="deny">Deny</button>
</form>
</body>
</html>
`)
    })
  }

}
```

The template string is written as the "ejs" template. This library binds the following values to the template at rendering.

* `providerName: string` - The provider name of the client.
* `scope: string` - The scope string devided by space the client code specifies.
* `scopes: Map<string, string>` - The map object which has a set of the scope name and its description.
* `encryptedAuthToken: string` - The encrypted auth token. You need to set this as the hidden parameter.
* `encryptedUserId: string` - The encrypted user ID. You need to set this as the hidden parameter.

And, you need to set the instance to the Configuration class instance as like the following:

```javascript
import * as functions from "firebase-functions";
import {authorize, Configuration, googleAccountAuthentication, token, userinfo} from "oauth2-firebase";
import {MyConsentViewTemplate} from "./my_consent_view_template"

Configuration.init({
  crypto_auth_token_secret_key_32: functions.config().crypto.auth_token_secret_key_32,
  project_api_key: functions.config().project.api_key,
  views_consent_template: new MyConsentViewTemplate()
});

exports.token = token();
exports.authorize = authorize();
exports.authentication = googleAccountAuthentication();
exports.userinfo = userinfo();

...
```
