export type DeviceInfo = {
    siloId: string;//Silo管理番号
    serialNumber?: string;//Silo管理番号
    judgment?:{
        status:[boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean]
        updatedAt:Date//最終更新日時
    }
    gps?: {
        latitude: number;//緯度
        longitude: number;//経度
        active:boolean//GPS位置特定完了
        connect:boolean//GPS接続状態
        updatedAt:Date//最終更新日時
    };
    power?:{
        voltage:number//電圧 V
        error:{
            low:boolean // 計測下限エラー
            high:boolean // 計測上限エラー
        }
        frequency:string　// 稼働周波数帯
        updatedAt:Date//最終更新日時
    }
    scale?:ScaleScanData
    address?:string;　// 住所
    oldGps?:{
        address?:{
            latitude: number;//緯度
            longitude: number;//経度
            updatedAt:Date//最終更新日時
        }
        previous?:{
            latitude: number;//緯度
            longitude: number;//経度
            updatedAt:Date//最終更新日時
        }
    }
    updatedAt?:Date//最終更新日時
    memo?:string
    onceUser?:string[] // 重量計アプリで使用 prevと差分があれば削除する
    user?:string[] // 権限所持してるユーザを確認できる
    currentPositionStartTime?:Date//住所変更があったあと初回起動日時
    adc?:ADCScanData
    adc2?:ADCScanData
    adc3?:ADCScanData
    configs?:{
        adc?:ADCConfig
        adc2?:ADCConfig
        adc3?:ADCConfig
    }
    userEditName?:string //各自で編集可能な名前
    siloInfo?:EditableSiloDeviceInfo
    silo2Info?:EditableSiloDeviceInfo
    silo3Info?:EditableSiloDeviceInfo
    viewScaleData?:ViewScaleData
    viewScaleData2?:ViewScaleData
    viewScaleData3?:ViewScaleData
}

export type ScaleScanData = {
    weight: number//重量 kg
    active: boolean//動作状態
    updatedAt: Date//最終更新日
}

export type ViewScaleData = {
    type:"weight"|"level"
    active:boolean//動作状態
    alert:boolean//アラート
    updatedAt:Date//最終更新日時
    weight:number//重量 kg weightのときのみ
    level:number // 0-100%
    height:number //高さ m
    status:"powerOff_low"|"over"|"normal"//エラーステータス
}

export type EditableSiloDeviceInfo = {
    cementType?:"normal"|"blast-furnace"|"high-early-strength"|"fly-ash"|"other"
    name?:string
    maxCapacity?:number
}

export type DeviceToken = {
    active:boolean // Tokenを有効無効管理
    devices: string[] // SiloIDの配列
    token: string //　URLに同梱するToken
}

export type DeviceAction = {
    type:"IN1"|"IN2"|"IN3"|"IN4"|"IN5"|"IN6"|"IN7"|"IN8"|"power"　// Type
    value:boolean|number // ステータス　power以外はBoolean
}

export type DeviceHistory = {
    types:string[]//actionsにあるtypeを重複しない形で保存
    actions:DeviceAction[]
    expires:Date//削除日時
    createAt:Date//作成日時
}

export type JSONDevice = {
    id:string
    type:string
    maxWeight?:number
}

export type JSONCenterDevice = {
    id:string
    silo1:{
        type:string
        //補正できるようにする
        maxWeight?:number
    }
    silo2:{
        type:string
        maxWeight?:number
    }
    silo3:{
        type:string
        maxWeight?:number
    }
}

export type JSONFile = {
    devices:JSONDevice[]
    stvn:JSONSiloConfig
    "stvn-level":JSONSiloConfig
    center_devices:JSONCenterDevice[]
}

export type Type3SiloConfig = {
    silo1:JSONSiloConfig,
    silo2:JSONSiloConfig,
    silo3:JSONSiloConfig
}

export type ADCConfig = {
    max:number
    min:number
    max_error:number
}
export type ADCScanData = {
    level:number// ADC Level
    active:boolean//動作状態
    updatedAt:Date//最終更新日時
}

export type JSONWeightConfig = {
    max:{
        value:number
        height:number
    }
    min:{
        value:number
        height:number
    }
    alert:{
        max:number
        min:number
    }
}

export type JSONLevelConfig = {
    max:{
        adc:number
        height:number
    }
    min:{
        adc:number
        height:number
    }
    alert:{
        max:number
        min:number
    }
}

export type JSONFileType = {
    center_devices:{
        id:string,
        silo1:{type:string},
        silo2:{type:string},
        silo3:{type:string}
    }
    devices:{id:string,type:string}[]
    "stvn":JSONSiloConfig
    "stvn-level":JSONSiloConfig
    "stvn-level-no-weight":JSONSiloConfig
}

export type JSONSiloConfig = {
    deviceType:"smartSilo"|"normalSilo"
    //normalSilo : 後付けサイロ
    //smartSilo : スマートサイロ
    name:string
    description:string
    levelType:"weight"|"level"
    weight?:JSONWeightConfig
    level?:JSONLevelConfig
    baseImage:string
    levelImage?:{
        viewType:"image"|"progress"
        imageMask?:string[]
        progressMask?:string
    }
    levelColor:string[]
    judgment:{
        mask:string
        open:{
            color:string
            text:string
        }
        close:{
            color:string
            text:string
        }
        title:string
        description:string
        active:boolean
        accept:"open"|"close"|""
        error:"open"|"close"|""
    }[]
}

export enum ViewErrorEnum {
    ERROR,
    ACCEPT,
    NONE
}