import {
  ADCConfig,
  ADCScanData,
  DeviceHistory,
  DeviceInfo,
  DeviceToken, EditableSiloDeviceInfo,
  JSONLevelConfig,
  JSONWeightConfig, ScaleScanData, ViewScaleData
} from "./dataType";
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

export function toDeviceHistory(doc: QueryDocumentSnapshot<DocumentData>): DeviceHistory {
  const info = {
    ...toObject<DeviceHistory>(doc),
  };
  info.createAt = (info.createAt as any as Timestamp).toDate()
  info.expires = (info.expires as any as Timestamp).toDate()
  return info
}

function orgRound(value:number, base:number) {
  return Math.round(value * base) / base;
}

function convertViewScaleData(
    scaleScan?: ScaleScanData,
    adcScan?: ADCScanData,
    adcConfig?: ADCConfig,
    weightConfig?: JSONWeightConfig,
    levelConfig?: JSONLevelConfig,
    siloInfo?:EditableSiloDeviceInfo,
    maxWeight?:number
): ViewScaleData | undefined {
  //重量の優先度
  // 1. 端末ごとに重量設定
  // 2. JSONに固有設定
  // 3. 機種ごとの重量設定
  // 4. 30T
  const maxWeightKg = siloInfo?.maxCapacity?siloInfo.maxCapacity * 1000:maxWeight?maxWeight:weightConfig?weightConfig.max.value:30000
  // 優先順位として scaleScan が存在する場合は weight を計算
  if (scaleScan && weightConfig) {
    const {weight, updatedAt} = scaleScan;

    // 重量から高さを計算
    const weightHeight =
        weight >= maxWeightKg
            ? weightConfig.max.height
            : weight <= weightConfig.min.value
            ? weightConfig.min.height
            : (weight - weightConfig.min.value) /
            (maxWeightKg - weightConfig.min.value) *
            (weightConfig.max.height - weightConfig.min.height) +
            weightConfig.min.height;

    // 重量から level (0-100%) を計算
    const level =
        weight >= maxWeightKg
            ? 100
            : weight <= weightConfig.min.value
            ? 0
            : (weight - weightConfig.min.value) /
            (maxWeightKg - weightConfig.min.value) * 100;

    // アラート判定
    const alert =
        weight > weightConfig.alert.max || weight < weightConfig.alert.min;
    // 状態の判定: 上限を超えると "over"、下限を下回ると "powerOff_low"
    const status =
        weight > weightConfig!.alert.max
            ? "over"
            : weight < weightConfig!.alert.min
            ? "powerOff_low"
            : "normal"
    return {
      type: "weight",
      active: scaleScan.active,
      alert,
      updatedAt,
      weight:orgRound(weight,100),
      level:orgRound(level,100), // levelを追加
      height: orgRound(weightHeight,100),
      status
    };
  }

  // scaleScan が存在しない場合は adcScan を使用
  if (adcScan && levelConfig) {
    const {level, updatedAt,} = adcScan;
    let adcHeight: number;
    let alert: boolean;
    let adcLevelPercent: number;
    let status: "powerOff_low"|"over"|"normal";

    if (adcConfig) {
      // ADCConfigが存在する場合、そちらを優先して計算
      adcHeight =
          level >= adcConfig.max
              ? levelConfig.max.height
              : level <= adcConfig.min
              ? levelConfig.min.height
              : (level - adcConfig.min) /
              (adcConfig.max - adcConfig.min) *
              (levelConfig.max.height - levelConfig.min.height) +
              levelConfig.min.height;

      alert = level > adcConfig.max_error || level < adcConfig.min;
      adcLevelPercent = (level - adcConfig.min) / (adcConfig.max - adcConfig.min) * 100;
      // 状態の判定: 上限を超えると "over"、下限を下回ると "powerOff_low"
      status =
          level > adcConfig.max_error
              ? "over"
              : level < adcConfig.min
              ? "powerOff_low"
              : "normal"

    } else {
      // ADCConfigがない場合、JSONLevelConfigを使用
      adcHeight =
          level >= levelConfig.max.adc
              ? levelConfig.max.height
              : level <= levelConfig.min.adc
              ? levelConfig.min.height
              : (level - levelConfig.min.adc) /
              (levelConfig.max.adc - levelConfig.min.adc) *
              (levelConfig.max.height - levelConfig.min.height) +
              levelConfig.min.height;

      alert = level > levelConfig.alert.max || level < levelConfig.alert.min;
      adcLevelPercent = (level - levelConfig.min.adc) / (levelConfig.max.adc - levelConfig.min.adc) * 100;
      // 状態の判定: 上限を超えると "over"、下限を下回ると "powerOff_low"
      status =
          level > levelConfig.alert.max
              ? "over"
              : level < levelConfig.alert.min
              ? "powerOff_low"
              : "normal"
    }

    const weight = (orgRound(adcLevelPercent,100) / 100) * maxWeightKg; // t -> kg 換算
    console.log(`maxCapacity :${maxWeightKg} ${siloInfo?.maxCapacity} ${orgRound(adcLevelPercent,100) / 100}`)
    return {
      type: "level",
      active: adcScan.active,
      alert,
      updatedAt,
      weight:orgRound(weight,100),
      level: orgRound(adcLevelPercent,100),
      height: orgRound(adcHeight,100),
      status
    };
  }

  return undefined; // どちらもアクティブでない場合は null
}

export function toDeviceInfo(doc: QueryDocumentSnapshot<DocumentData>,weightConfig?:JSONWeightConfig,levelConfig?:JSONLevelConfig): DeviceInfo {
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
  if(info.adc){
    info.adc.updatedAt =  (info.adc.updatedAt as any as Timestamp).toDate();
  }
  if(info.adc2){
    info.adc2.updatedAt =  (info.adc2.updatedAt as any as Timestamp).toDate();
  }
  if(info.adc3){
    info.adc3.updatedAt =  (info.adc3.updatedAt as any as Timestamp).toDate();
  }
  if(info.oldGps){
    if(info.oldGps.address){
      info.oldGps.address.updatedAt =  (info.oldGps.address.updatedAt as any as Timestamp).toDate();
    }
    if(info.oldGps.previous){
      info.oldGps.previous.updatedAt =  (info.oldGps.previous.updatedAt as any as Timestamp).toDate();
    }
  }
  if(info.currentPositionStartTime){
    info.currentPositionStartTime = (info.currentPositionStartTime as any as Timestamp).toDate();
  }
  info.viewScaleData = convertViewScaleData(info.scale,info.adc,info.configs?.adc,weightConfig,levelConfig,info.siloInfo)
  info.viewScaleData2 = convertViewScaleData(undefined,info.adc2,info.configs?.adc2,weightConfig,levelConfig,info.silo2Info)
  info.viewScaleData3 = convertViewScaleData(undefined,info.adc3,info.configs?.adc3,weightConfig,levelConfig,info.silo3Info)
  return info;
}

export function toTokens(docs: QuerySnapshot): DeviceToken[] {
  if(docs.empty){return []}
  return docs.docs.map((value) => {
    return {
      ...toObjectSnapshot<DeviceToken>(value)
    }})
}