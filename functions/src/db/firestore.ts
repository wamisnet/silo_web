import admin from "../Firebase";
import {toInfo,toInfos,toTokens} from "./convert";
import {DeviceInfo, DeviceToken, UpdateDeviceInfo} from "./type";
import {GeoPoint} from "@google-cloud/firestore";
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export const getDeviceTokenList = async (
  siloId: string
): Promise<DeviceToken[]> => {
  return toTokens(
    await db.collection("token").where('devices', 'array-contains', siloId).where("active","==",true).get()
  );
};

export const getDeviceInfo = async (
  siloId: string
): Promise<DeviceInfo> => {
  return toInfo(
    await db.collection("devices").doc(siloId).get()
  );
};

export const getScheduledDailyDeviceInfo = async (): Promise<DeviceInfo[]> => {
  const date = new Date()
  date.setHours(date.getHours()-24)
  return toInfos(
      await db.collection("devices").where('lastDate', '>', date).get()
  );
};

export const getScheduledHourlyDeviceInfo = async (): Promise<DeviceInfo[]> => {
  const date = new Date()
  date.setHours(date.getHours()-1)
  return toInfos(
      await db.collection("devices").where('lastDate', '>', date).get()
  );
};

export const addDeviceOnceUser = async (dbId: string, uid:string) => {
    await db.collection("devices").doc(dbId).update("onceUser",admin.firestore.FieldValue.arrayUnion(uid))
};

export const deleteDeviceOnceUser = async (dbId: string, uid:string) => {
    await db.collection("devices").doc(dbId).update("onceUser",admin.firestore.FieldValue.arrayRemove(uid))
};

export const clearDeviceOnceUser = async (dbId: string) => {
  await db.collection("devices").doc(dbId).update("onceUser",[])
};

export const updateDevice = async (dbId: string, updateDeviceInfo:UpdateDeviceInfo) => {
    await db.collection("devices").doc(dbId).update({
      ...updateDeviceInfo,
      lastDate:admin.firestore.FieldValue.serverTimestamp()
    })
};

export const updateOldLocation = async (dbId: string, location:GeoPoint) => {
    await db.collection("devices").doc(dbId).update({
      oldLocation:location,
    })
};