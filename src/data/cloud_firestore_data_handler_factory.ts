import {DataHandler, DataHandlerFactory, Request} from "oauth2-nodejs";
import {CloudFirestoreDataHandler} from "./cloud_firestore_data_handler";

export class CloudFirestoreDataHandlerFactory implements DataHandlerFactory {

  create(request: Request): DataHandler {
    return new CloudFirestoreDataHandler(request)
  }

}
