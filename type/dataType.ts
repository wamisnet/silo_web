import firebase from "firebase/compat";
import GeoPoint = firebase.firestore.GeoPoint;

export interface DeviceInfo {
    weight:number
    deviceName:string
    lastDate:Date
    dbId:string
    location:GeoPoint
}