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
    scale?:{
        weight:number//重量 kg
        active:boolean//動作状態
        updatedAt:Date//最終更新日時
    }
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
    adc?:{
        level:number// ADC Level
        active:boolean//動作状態
        updatedAt:Date//最終更新日時
    }
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
}

export type JSONFile = {
    devices:JSONDevice[]
    stvn:JSONSiloConfig
    "stvn-level":JSONSiloConfig
}


export type JSONSiloConfig = {
    name:string
    description:string
    levelType:"weight"|"level"
    weight?:{
        max:number
        min:number
    }
    level?:{
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