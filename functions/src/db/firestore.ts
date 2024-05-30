import admin from "../Firebase";
import {toTokens} from "./convert";
import {DeviceEditConfig, DeviceToken} from "./type";
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export const getDeviceTokenList = async (
  siloId: string
): Promise<DeviceToken[]> => {
  return toTokens(
    await db.collection("token").where('devices', 'array-contains', siloId).where("active","==",true).get()
  );
};

export const addDeviceOnceUser = async (dbId: string, uid:string) => {
    await db.collection("v2devices").doc(dbId).update("onceUser",admin.firestore.FieldValue.arrayUnion(uid))
};

export const deleteDeviceOnceUser = async (dbId: string, uid:string) => {
    await db.collection("v2devices").doc(dbId).update("onceUser",admin.firestore.FieldValue.arrayRemove(uid))
};

export const clearDeviceOnceUser = async (dbId: string) => {
  await db.collection("v2devices").doc(dbId).update("onceUser",[])
};

export const editDeviceConfig = async (dbId: string,config:DeviceEditConfig) => {
    await db.collection("v2devices").doc(dbId).update(config)
};