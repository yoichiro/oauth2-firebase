import {Request} from "oauth2-nodejs";

export class RequestMap implements Request {

  private _headerMap: Map<string, string>
  private _parameterMap: Map<string, string>

  constructor() {
    this._headerMap = new Map<string, string>()
    this._parameterMap = new Map<string, string>()
  }

  getHeader(name: string): string | undefined {
    return this._headerMap.get(name)
  }

  setHeader(name: string, value: string): void {
    this._headerMap.set(name, value)
  }

  getParameter(name: string): string | undefined {
    return this._parameterMap.get(name)
  }

  setParameter(name: string, value: string): void {
    this._parameterMap.set(name, value)
  }

  getParameterMap(): Map<string, string> {
    return this._parameterMap
  }

}