
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

export interface DeviceEditConfig {
  serialNumber?:string
  userEditName?:string
  siloInfo:EditableSiloDeviceInfo
  silo2Info:EditableSiloDeviceInfo
  silo3Info:EditableSiloDeviceInfo
}

export type EditableSiloDeviceInfo = {
  cementType:"normal"|"blast-furnace"|"high-early-strength"|"fly-ash"|"other"
  name:string
  maxCapacity:number
}