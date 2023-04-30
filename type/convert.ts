import {DeviceInfo, DeviceToken} from "./dataType";
import firestore from "firebase/firestore";
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;
import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot;
import QuerySnapshot = firestore.QuerySnapshot;
import Timestamp = firestore.Timestamp;


class BaseError extends Error {
  constructor(e?: string) {
    super(e);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DocumentNotExistError extends BaseError {}

type Document = FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;

export function toObject<T>(doc: QueryDocumentSnapshot): T {
  if (!doc.exists) throw new DocumentNotExistError(doc.ref.path);
  const obj: any = {
    ...doc.data(),
  };
  return obj as T;
}

export function toObjectSnapshot<T>(doc: DocumentSnapshot): T {
  if (!doc.exists) throw new DocumentNotExistError(doc.ref.path);
  const obj: any = {
    ...doc.data(),
  };
  return obj as T;
}

export function toDeviceInfo(doc: QueryDocumentSnapshot<DocumentData>): DeviceInfo {
  const info = {
    ...toObject<DeviceInfo>(doc),
  };
  if(info.updatedAt) {
    info.updatedAt = (info.updatedAt as any as Timestamp).toDate()
  }
  if (info.gps) {
    info.gps.updatedAt = (info.gps.updatedAt as any as Timestamp).toDate();
  }
  if(info.judgment){
    info.judgment.updatedAt =  (info.judgment.updatedAt as any as Timestamp).toDate();
  }
  if(info.power){
    info.power.updatedAt =  (info.power.updatedAt as any as Timestamp).toDate();
  }
  if(info.scale){
    info.scale.updatedAt =  (info.scale.updatedAt as any as Timestamp).toDate();
  }
  if(info.oldGps){
    if(info.oldGps.address){
      info.oldGps.address.updatedAt =  (info.oldGps.address.updatedAt as any as Timestamp).toDate();
    }
    if(info.oldGps.previous){
      info.oldGps.previous.updatedAt =  (info.oldGps.previous.updatedAt as any as Timestamp).toDate();
    }
  }
  return info;
}

export function toTokens(docs: QuerySnapshot): DeviceToken[] {
  if(docs.empty){return []}
  return docs.docs.map((value) => {
    return {
      ...toObjectSnapshot<DeviceToken>(value)
    }})
}