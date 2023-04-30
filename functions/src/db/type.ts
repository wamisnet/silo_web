
import {GeoPoint} from "@google-cloud/firestore";
export interface DeviceInfo {
  weight:number
  id:string
  dbId:string
  location:GeoPoint
  oldLocation?:GeoPoint
  onceUser:string[]
}

export interface DeviceToken {
  active:boolean
  devices:string[]
  token:string
}
