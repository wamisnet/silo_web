import * as functions from "firebase-functions";
import {
    addDeviceOnceUser,
    getDeviceTokenList,
    deleteDeviceOnceUser,
} from "./db/firestore";

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

