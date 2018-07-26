import {Request} from "oauth2-nodejs";
import * as express from "express";

export class RequestWrapper implements Request {

  private _original: express.Request

  constructor(original: express.Request) {
    this._original = original
  }

  getHeader(name: string): string {
    return this._original.get(name) || ""
  }

  getParameter(name: string): string | undefined {
    return this._original.query[name] || this._original.body[name]
  }

  getParameterMap(): Map<string, string> {
    const result = new Map<string, string>()
    for (const key in this._original.query) {
      if (this._original.body.hasOwnProperty(key)) {
        result.set(key, this._original.query[key])
      }
    }
    for (const key in this._original.body) {
      if (this._original.body.hasOwnProperty(key)) {
        result.set(key, this._original.body[key])
      }
    }
    return result
  }

}
