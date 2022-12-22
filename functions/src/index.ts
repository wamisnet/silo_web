import * as functions from "firebase-functions";
import {
    addDeviceOnceUser,
    getDeviceTokenList,
    deleteDeviceOnceUser,
    updateOldLocation,
    clearDeviceOnceUser,
    updateDevice,
    getScheduledHourlyDeviceInfo,
    getScheduledDailyDeviceInfo
} from "./db/firestore";
import {distance} from "./map";
import {RequestApiUpdateDeviceInfo} from "./db/type";
import {GeoPoint} from "@google-cloud/firestore";

//サイロにアクセスリクエストを行う
export const requestAccessPermissionSilo = functions.region("asia-northeast2").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }
    const siloId = data.docId as string | undefined
    const token = data.token as string | undefined
    if(!siloId || !token){
        throw new functions.https.HttpsError('invalid-argument', 'DataId params not found');
    }
    console.log('requestAccessPermissionSilo context.auth.uid: ' + context.auth.uid + siloId)
    //tokenが正しいかチェック
    const tokens = await getDeviceTokenList(siloId)
    const find = tokens.find(value => value.token === token )
    if(find){
        //アクセス権限を追加する
        //  追加の関数を使い、ない時だけ追加される
        await addDeviceOnceUser(siloId,context.auth.uid)
    }else{
        throw new functions.https.HttpsError('permission-denied', 'AccessToken not found');
    }
    return {status:"success"}

})

//サイロに付与されているアクセス権限を削除する
export const deleteAccessPermissionSilo = functions.region("asia-northeast2").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }
    const docId = data.docId as string | undefined
    if (!docId) {
        throw new functions.https.HttpsError('invalid-argument', 'dataId params not found');
    }
    console.log('deleteAccessPermissionSilo context.auth.uid: ' + context.auth.uid + docId)
    await deleteDeviceOnceUser(docId,context.auth.uid)
    return {status:"success"}
})

//00:00に過去の住所と1km程度離れていたら今までのアクセス権限を消す
exports.scheduledDailyFunction = functions.region("asia-northeast2").pubsub.schedule("0 0 * * *")
    .timeZone('Asia/Tokyo')
    .onRun(async () => {
        console.log("00:00 start ScheduledFunction");
        const devices = await getScheduledDailyDeviceInfo();
        await Promise.all(devices.map(device => {
            if(device.oldLocation && distance(device.oldLocation,device.location) > 1.0){
                clearDeviceOnceUser(device.dbId)
            }
        }))
        await Promise.all(devices.map(device => updateOldLocation(device.dbId,device.location)))
        return null;
    });

//毎時30分に過去の住所と1km程度離れていたら今までのアクセス権限を消す
exports.scheduledHourlyFunction = functions.region("asia-northeast2").pubsub.schedule("30 * * * *")
    .timeZone('Asia/Tokyo')
    .onRun(async () => {
        console.log("every half hour start ScheduledFunction");
        const devices = await getScheduledHourlyDeviceInfo();
        await Promise.all(devices.map(device => {
            if(device.oldLocation && distance(device.oldLocation,device.location) > 1.0){
                clearDeviceOnceUser(device.dbId)
            }
        }))
        return null;
    });

//データを追加する
exports.updateDevice = functions.region("asia-northeast2")
    .https.onRequest(async (request, response) => {
        const authorization = request.get("authorization");
        if (!authorization && authorization === "ApiKey aDIew1bUdvVUJ4tdzd1N2JuYzE6X3p0dU9YcmZUNlNKM3RqdWt6WU9hZw==") {
            throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
        }
        const data = request.body.data as RequestApiUpdateDeviceInfo[]
        await Promise.all(data.map(value => updateDevice(value.id,{ location:new GeoPoint(value.location.latitude, value.location.longitude),weight:value.weight})))
        response.json({status:"success"})
    });