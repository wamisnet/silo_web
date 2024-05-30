import * as functions from "firebase-functions";
import {
    addDeviceOnceUser,
    getDeviceTokenList,
    deleteDeviceOnceUser, editDeviceConfig,
} from "./db/firestore";
import {EditableSiloDeviceInfo} from "./db/type";

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


//サイロに付与されているアクセス権限を削除する
export const editSiloConfig = functions.region("asia-northeast2").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }
    const docId = data.docId as string | undefined
    if (!docId) {
        throw new functions.https.HttpsError('invalid-argument', 'dataId params not found');
    }
    console.log('editSiloConfig context.auth.uid: ' + context.auth.uid + docId)
    const userEditName = data.deviceInfo?.userEditName as string | undefined
    if (!userEditName) {
        throw new functions.https.HttpsError('invalid-argument', 'userEditName params not found');
    }
    const info = checkEditableSiloDeviceInfo(data.deviceInfo?.siloInfo?.cementType,data.deviceInfo?.siloInfo?.name,data.deviceInfo?.siloInfo?.maxCapacity?Number(data.deviceInfo?.siloInfo?.maxCapacity):0)
    if(!info)
        throw new functions.https.HttpsError('invalid-argument', 'siloInfo params not found');
    const info2 = checkEditableSiloDeviceInfo(data.deviceInfo?.silo2Info?.cementType,data.deviceInfo?.silo2Info?.name,data.deviceInfo?.silo2Info?.maxCapacity?Number(data.deviceInfo?.silo2Info?.maxCapacity):0)
    if(!info2)
        throw new functions.https.HttpsError('invalid-argument', 'siloInfo2 params not found');
    const info3 = checkEditableSiloDeviceInfo(data.deviceInfo?.silo3Info?.cementType,data.deviceInfo?.silo3Info?.name,data.deviceInfo?.silo3Info?.maxCapacity?Number(data.deviceInfo?.silo3Info?.maxCapacity):0)
    if(!info3)
        throw new functions.https.HttpsError('invalid-argument', 'siloInfo3 params not found');

    await editDeviceConfig(docId,{
        userEditName,
        siloInfo: info,
        silo2Info: info2,
        silo3Info: info3,
    })
    return {status:"success"}
})

const checkEditableSiloDeviceInfo = (cementType?:string,name?:string,maxCapacity?:number):EditableSiloDeviceInfo|null =>{
    if(!cementType || !name || !maxCapacity)
        return null
    return {
        cementType,
        name,
        maxCapacity
    } as EditableSiloDeviceInfo
}