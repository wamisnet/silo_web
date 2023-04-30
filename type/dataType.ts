export type DeviceInfo = {
    siloId: string;//Silo管理番号
    serialNumber?: string;//Silo管理番号
    judgment?:{
        thermalVertical:boolean,//縦スクリューサーマル
        thermalDrawer:boolean,//横スクリューサーマル
        levelMax:boolean,//満量ランプ
        levelMin:boolean,//下限ランプ
        buzzerMax:boolean//満量ブザー
        updatedAt:Date//最終更新日時
    }
    gps?: {
        latitude: number;//緯度
        longitude: number;//経度
        active:boolean//動作状態
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
}

export type DeviceToken = {
    active:boolean // Tokenを有効無効管理
    devices: string[] // SiloIDの配列
    token: string //　URLに同梱するToken
}