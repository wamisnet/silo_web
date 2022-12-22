import {
  DeviceInfo, DeviceToken,
} from "./type";
import {firestore} from "firebase-admin/lib/firestore/firestore-namespace";
import QuerySnapshot = firestore.QuerySnapshot;
type Document = FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
class BaseError extends Error {
  constructor(e?: string) {
    super(e);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DocumentNotExistError extends BaseError {}

export function toObject<T>(doc: Document): T {
  if (!doc.exists) throw new DocumentNotExistError();
  const obj: any = {
    ...doc.data(),
  };
  return obj as T;
}

export function toTokens(docs: QuerySnapshot): DeviceToken[] {
  console.log(docs.size)
  if(docs.empty){return []}
  return docs.docs.map((value) => {
    console.log(value.data())
    return {
    ...toObject<DeviceToken>(value)
  }})
}
export function toInfos(docs: QuerySnapshot): DeviceInfo[] {
  if(docs.empty){return []}
  return docs.docs.map(value => {
    return {
    ...toObject<DeviceInfo>(value),
    dbId:value.id
  }})
}

export function toInfo(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): DeviceInfo {
  return {
      ...toObject<DeviceInfo>(doc),
    }
}