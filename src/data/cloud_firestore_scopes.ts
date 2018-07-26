import * as admin from "firebase-admin";
import * as firestore from "@google-cloud/firestore";

export class CloudFirestoreScopes {

  public static async fetch(): Promise<Map<string, string>> {
    const db = admin.firestore()
    const snapshot = await db.collection("scopes").get()
    const result = new Map<string, string>()
    snapshot.forEach((doc: firestore.QueryDocumentSnapshot): void => {
      result.set(doc.get("name"), doc.get("description"))
    })
    return result
  }

}
