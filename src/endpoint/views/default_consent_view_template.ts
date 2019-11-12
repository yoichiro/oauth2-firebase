import * as fs from "fs";
import * as path from "path";
import {ConsentViewTemplate} from "./consent_view_template";
import { Configuration } from "../../utils";

export class DefaultConsentViewTemplate implements ConsentViewTemplate {

  public provide(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(path.join(Configuration.instance.view_path, "consent.ejs"), "utf8", (err, data) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

}
