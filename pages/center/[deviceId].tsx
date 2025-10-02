import React, {useEffect, useState} from "react";
import Head from "next/head";
import {useRouter} from "next/router";
import Header from "../../components/header";
import styles from "../../styles/Home.module.css";
import InfoCardView from "../../layout/InfoCardView";
import {onSnapshot,collection, query, where} from "firebase/firestore";
import {auth, firestore, functions} from "../../components/Firebase";
import {
    ADCConfig,
    ADCScanData,
    DeviceInfo, EditableSiloDeviceInfo,
    JSONCenterDevice,
    JSONDevice,
    JSONSiloConfig,
    Type3SiloConfig,
} from "../../type/dataType";
import Loading from "../../components/loading";
import ErrorView from "../../layout/ErrorView";
import indexStyle from "../index.module.css";
import Link from "next/link";
import {toDeviceInfo} from "../../type/convert";
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCardText,
    CCol, CFormInput, CFormSelect,
    CRow
} from "@coreui/react";
import style from "../../layout/InfoCardView.module.css";
import fsPromises from 'fs/promises'
import path from "node:path";
import { GetStaticProps, GetStaticPaths, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from 'querystring';

import {NextPage} from "next";
import useInterval from "use-interval";
import {httpsCallable} from "firebase/functions";
import {usePageLeaveConfirmation} from "../../components/usePageLeaveConfirmation";
import SiloCenterImage from "../../components/SiloCenterImage";
interface MyParams extends ParsedUrlQuery {
    deviceId: string;
}
const DevicePage:NextPage<Type3SiloConfig | undefined> = (props) => {
    const router = useRouter()
    const {deviceId,token} = router.query
    const [counter,setCounter] = useState(200)
    const [loading,setLoading] = useState(true)
    const [online,setOnline] = useState(false)
    const [device,setDevice] = useState<DeviceInfo|undefined>(undefined)
    // const [device,setDevice] = useState<DeviceInfo|undefined>({
    //     siloId:"STC-01",
    //     address:"〒454-0824 愛知県名古屋市中川区蔦元町２丁目７２",
    //     gps:{
    //         active:true,
    //         latitude:35.1416523,
    //         longitude:136.8726856,
    //         updatedAt:new Date(),
    //         connect:true
    //     },
    //     currentPositionStartTime:new Date(),
    //     updatedAt:new Date(),
    //     adc:{
    //         level:counter,
    //         active:true,
    //         updatedAt:new Date()
    //     },
    //     adc2:{
    //         level:counter,
    //         active:true,
    //         updatedAt:new Date()
    //     },
    //     adc3:{
    //         level:counter,
    //         active:true,
    //         updatedAt:new Date()
    //     }
    // })
    const [errorMessage,setErrorMessage] = useState("")
    const [isDirty ,setDirty] = useState(false)
    // const [state, setState] = useState<number>(0);
    // useInterval(() => {
    //     if(counter > 512){
    //         setCounter(0)
    //     }else {
    //         setCounter(counter + 25)
    //     }
    //     let deviceInfo = device
    //     if(!deviceInfo)return
    //     deviceInfo.adc = {
    //         level:counter,
    //         active:true,
    //         updatedAt:new Date()
    //     }
    //     deviceInfo.adc2 = {
    //         level:counter,
    //         active:true,
    //         updatedAt:new Date()
    //     }
    //     deviceInfo.adc3 = {
    //         level:counter,
    //         active:true,
    //         updatedAt:new Date()
    //     }
    //     setDevice(deviceInfo)
    // }, 1000);
    useEffect(() => {
        // Update the document title using the browser API
        if(router.isReady && deviceId) {
            console.log("fast token", token)
            console.log("fast token", deviceId)
            if(token) {
                setLoading(true)

                const requestSilo = httpsCallable(functions, 'requestAccessPermissionSilo');
                requestSilo({docId: deviceId, token})
                    .then(value => console.log(value))
                    .catch(e => {
                        if(e.code == "functions/permission-denied" || e.code == "functions/invalid-argument") {
                            setErrorMessage("読み取ったQRコードは正しくありません。")
                        }else if(e.code == "failed-precondition"){
                            setErrorMessage("再度開きなおすか、ブラウザをリセットしてください。")
                        }else{
                            setErrorMessage("予期しないエラーが発生しました。オンラインになっているか確認したのち再度開きなおすか、ブラウザをリセットしてください。")
                        }
                    }).finally(() => setLoading(false))
            }
            const unsub = onSnapshot(
                query(
                    collection(firestore, "v2devices"),
                    where('onceUser', 'array-contains', auth.currentUser?.uid),
                    where("siloId", "==", deviceId)
                ), (query) => {
                    if(query.empty){
                        console.log("empty")
                    }else {
                        query.forEach(doc => {
                            const data = doc.data()
                            console.log("Current data: ", data, doc.id)
                            const device = toDeviceInfo(doc)
                            setDevice(device)
                            if (device.updatedAt != undefined) {
                                const localTime = new Date();
                                const differenceInMinutes = (localTime.getTime() - device.updatedAt.getTime()) / (1000 * 60)
                                setOnline(Math.abs(differenceInMinutes) <= 25)
                            }
                        })
                    }
                    setLoading(false)
                })
            return () => {
                unsub()
            }
        }
    },[deviceId]);

    useInterval(()=>{
        if (device?.updatedAt != undefined) {
            const localTime = new Date();
            const differenceInMinutes = (localTime.getTime() - device.updatedAt.getTime()) / (1000 * 60)
            setOnline(Math.abs(differenceInMinutes) <= 25)
        }
    },60000)
    const handleEditOnChange = async (event: any) => {
        if(!isDirty) {
            alert("設定を反映させるために保存ボタンを押してください")
        }
        setDirty(true)
        console.log("handleEditOnChange",event)
    }

    usePageLeaveConfirmation(!isDirty)

    const handleCommandSubmit = async (event: any) => {
        event.preventDefault()
        if(!isDirty)return
        let deviceInfo = device?device:{} as DeviceInfo
        deviceInfo.userEditName = event.target.name.value
        deviceInfo.siloInfo = {
            cementType: event.target.silo1_type.value,
            name: event.target.silo1_name.value,
            maxCapacity: Number(event.target.silo1_max_capacity.value)
        }
        deviceInfo.silo2Info = {
            cementType: event.target.silo2_type.value,
            name: event.target.silo2_name.value,
            maxCapacity: Number(event.target.silo2_max_capacity.value)
        }
        deviceInfo.silo3Info = {
            cementType: event.target.silo3_type.value,
            name: event.target.silo3_name.value,
            maxCapacity: Number(event.target.silo3_max_capacity.value)
        }
        // console.log(deviceInfo)
        try {
            setLoading(true)
            const requestSilo = httpsCallable(functions, 'editSiloConfig');
            await requestSilo({docId: deviceId, deviceInfo})
            setDevice(deviceInfo)

            setDirty(false)
        }catch (e:any) {
            if(e.code == "functions/permission-denied" || e.code == "functions/invalid-argument") {
                alert("データは正しくありません。")
            }else if(e.code == "failed-precondition"){
                alert("再度開きなおすか、ブラウザをリセットしてください。")
            }else{
                alert("予期しないエラーが発生しました。オンラインになっているか確認したのち再度開きなおすか、ブラウザをリセットしてください。")
            }
        }finally {
            setLoading(false)
        }
    }
    const checkAdc = (deviceScan:ADCScanData|undefined,deviceConfig:ADCConfig|undefined,config:JSONSiloConfig):number =>{
        console.log(`deviceScan ${JSON.stringify(deviceScan)} deviceConfig ${JSON.stringify(deviceConfig)} config:${JSON.stringify(config)}`)
        if(deviceScan && config.level){
            if(config.level.alert.min > deviceScan.level){
                return -2 //センサーの電源がOFFかセンサーが異常です
            }
            if(deviceConfig){//DBに端末固有のADC補正値がある場合
                if(deviceConfig.max_error < deviceScan.level)
                    return -3 //計測上限越え
                const level = (deviceScan.level - deviceConfig.min) / (deviceConfig.max - deviceConfig.min) * 100
                return level <= 0?0:level>=100?100:level
            }else{//DBに端末固有の補正値がない場合
                if(config.level.alert.max < deviceScan.level)
                    return -3 //計測上限越え
                const level = (deviceScan.level - config.level.min.adc) / (config.level.max.adc - config.level.min.adc) * 100
                return level <= 0?0:level>=100?100:level
            }
        }
        return -1 //not found
    }
    type Props = {
        info:EditableSiloDeviceInfo|undefined
        adcLevel:number
        maxJudgment:boolean|undefined
        deviceScan:ADCScanData|undefined
    }
    const CreateLevelView:NextPage<Props> = (props) =>{
        switch (props.adcLevel){
            case -1: //not found
                return <CCardText>ADCデータがありません</CCardText>
            case -2: //センサーの電源がOFFかセンサーが異常です
                return <CCardText>センサーの電源がOFFかセンサーが異常です ({props.deviceScan?.updatedAt.toLocaleString()}) </CCardText>
            case -3: //計測上限越え
                return <CCardText>計測上限です ({props.deviceScan?.updatedAt.toLocaleString()})</CCardText>
        }
        return(
            <>
                <CFormInput label="在庫" type="text" plainText value={`${props.adcLevel.toFixed()} % (${((props.info?.maxCapacity??0)*(props.adcLevel/100)).toFixed(2)} t)`} readOnly className="mb-3"/>
                <SiloCenterImage level={props.adcLevel} cementType={props.info?.cementType??"normal"} maxJudgment={props.maxJudgment??false}/>
            </>
        )
    }

    const isWithin15Minutes = (lastUpdated?: Date): boolean => {
        if(!lastUpdated)return false
        const now = new Date();
        const diffInMilliseconds = now.getTime() - lastUpdated.getTime();
        const diffInMinutes = diffInMilliseconds / (1000 * 60);

        return diffInMinutes <= 15;
    }
    if(device && props) {
        let silo1AdcLevel = checkAdc(device.adc,device.configs?.adc,props.silo1)
        let silo2AdcLevel = checkAdc(device.adc2,device.configs?.adc2,props.silo2)
        let silo3AdcLevel = checkAdc(device.adc3,device.configs?.adc3,props.silo3)
        return (
            <>
                <Head>
                    <title>Smart Silo - {deviceId}</title>
                </Head>
                <Header/>

                <main className={styles.main}>
                    <form onSubmit={handleCommandSubmit}>
                        <CRow>
                            <CCol lg={6}>
                                <CFormInput id="name" label="名称" type="text" maxLength={60} defaultValue={device.userEditName?device.userEditName:device.siloId} onChange={handleEditOnChange} required className={"mb-3"}/>
                            </CCol>
                            <CCol lg={6}>
                                {device.gps?
                                <CFormInput label="住所" plainText value={`${device.address?.replace(/〒?[0-9]{3}-?[0-9]{4}\s*/,"")} ${device.gps.active?"位置確定":device.gps.connect?"位置確定前(最終位置を表示中)":"未接続(最終位置を表示中)"} ${device.gps.updatedAt.toLocaleString()}`} readOnly/>
                                :<CFormInput label="住所" plainText value={"位置情報がありません"} readOnly/>
                                }
                            </CCol>
                        </CRow>
                        <CRow className={"mt-3"}>
                            <CCol lg={6}>
                                <ul className={"mx-3 mb-3"}>
                                    <li>ID: {device.siloId}</li>
                                    <li>管理番号: {device.serialNumber??"未設定"}</li>
                                    <li>始動日: {device.currentPositionStartTime?.toLocaleString()??"未開始"}</li>
                                    <li>更新日: {device.updatedAt?.toLocaleString()??"最終更新日がありません"}</li>
                                    <li>通信状況 : {isWithin15Minutes(device.updatedAt)? <div style={{ color: 'green' ,display:"contents" }}>● OK</div>: <div style={{ color: 'red' ,display:"contents" }}>× NG</div>}</li>
                                </ul>

                            </CCol>
                            <CCol lg={2} className="mb-3">
                                {device.gps && device.gps.active ?
                                    <a href={'https://www.google.co.jp/maps/place/' + device.gps.latitude + ',' + device.gps.longitude}
                                       target="_blank" rel="noopener noreferrer"
                                       className="btn btn-outline-primary">
                                        大きな画面で見る（GoogleMap）</a>:<></>
                                }
                            </CCol>
                            <CCol lg={4} className="mb-3">
                                <button className="btn btn-outline-primary w-100 pt-3 pb-3" type="submit">保存</button>
                            </CCol>
                        </CRow>
                        <CRow className={"mt-3"}>
                            <CCol lg={4}>
                                <CCard className="mb-3">
                                    <CCardHeader className={style.status_title}>
                                        サイロ1
                                    </CCardHeader>
                                    <CCardBody>
                                        <CFormSelect label="品種" id="silo1_type" defaultValue={device?.siloInfo?.cementType??"normal"} onChange={handleEditOnChange} className="mb-3">
                                            <option value="normal">普通</option>
                                            <option value="blast-furnace">高炉</option>
                                            <option value="high-early-strength">早強</option>
                                            <option value="fly-ash">フライアッシュ</option>
                                            <option value="other">その他</option>
                                        </CFormSelect>
                                        <CFormInput id="silo1_name" label="名称" type="text" maxLength={20} defaultValue={device?.siloInfo?.name??"未設定1"} onChange={handleEditOnChange} required className="mb-3"/>
                                        <CFormInput id="silo1_max_capacity" label="最大内容量(t)" type="number" min={1} max={100000} defaultValue={device?.siloInfo?.maxCapacity??0} onChange={handleEditOnChange} required className="mb-3"/>
                                        <CreateLevelView info={device.siloInfo} adcLevel={silo1AdcLevel} maxJudgment={device.judgment?.status[0]} deviceScan={device.adc}/>

                                    </CCardBody>
                                </CCard>
                            </CCol>
                            <CCol lg={4}>
                                <CCard className="mb-3">
                                    <CCardHeader className={style.status_title}>
                                        サイロ2
                                    </CCardHeader>
                                    <CCardBody>
                                        <CFormSelect label="品種" id="silo2_type" defaultValue={device.silo2Info?.cementType??"normal"} onChange={handleEditOnChange} className="mb-3">
                                            <option value="normal">普通</option>
                                            <option value="blast-furnace">高炉</option>
                                            <option value="high-early-strength">早強</option>
                                            <option value="fly-ash">フライアッシュ</option>
                                            <option value="other">その他</option>
                                        </CFormSelect>
                                        <CFormInput id="silo2_name" label="名称" type="text" maxLength={20} defaultValue={device?.silo2Info?.name??"未設定2"} onChange={handleEditOnChange} required className="mb-3"/>
                                        <CFormInput id="silo2_max_capacity" label="最大内容量(t)" type="number" min={1} max={100000} defaultValue={device?.silo2Info?.maxCapacity??0} onChange={handleEditOnChange} required className="mb-3"/>
                                        <CreateLevelView info={device.silo2Info} adcLevel={silo2AdcLevel} maxJudgment={device.judgment?.status[1]} deviceScan={device.adc2}/>

                                    </CCardBody>
                                </CCard>

                            </CCol>
                            <CCol lg={4}>
                                <CCard className="mb-3">
                                    <CCardHeader className={style.status_title}>
                                        サイロ3
                                    </CCardHeader>
                                    <CCardBody>
                                        <CFormSelect label="品種" id="silo3_type" defaultValue={device?.silo3Info?.cementType??"normal"} onChange={handleEditOnChange} className="mb-3">
                                            <option value="normal">普通</option>
                                            <option value="blast-furnace">高炉</option>
                                            <option value="high-early-strength">早強</option>
                                            <option value="fly-ash">フライアッシュ</option>
                                            <option value="other">その他</option>
                                        </CFormSelect>
                                        <CFormInput id="silo3_name" label="名称" type="text" maxLength={20} defaultValue={device?.silo3Info?.name??"未設定3"} onChange={handleEditOnChange} required className="mb-3"/>
                                        <CFormInput id="silo3_max_capacity" label="最大内容量(t)" type="number" min={1} max={100000} defaultValue={device?.silo3Info?.maxCapacity??0} onChange={handleEditOnChange} required className="mb-3"/>
                                        <CreateLevelView info={device.silo3Info} adcLevel={silo3AdcLevel} maxJudgment={device.judgment?.status[2]} deviceScan={device.adc3}/>
                                    </CCardBody>
                                </CCard>

                            </CCol>
                        </CRow>
                    </form>
                </main>
            </>
        );
    }else{
        if(!props){
           return( <>
                <Head>
                    <title>Smart Silo - {deviceId}</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>
                <ErrorView errorMessage={"デバイスの情報がありません。管理者に連絡ください。"}/>
               <div className={indexStyle.bottom_button}>
                   <Link href={"/user.tsx"}>
                       <button type="button" className={"btn btn-primary rounded-pill"}>
                           トップページへ
                       </button>
                   </Link>
               </div>
            </>)
        }
        if (loading) {
            console.log("loading...")
            return <Loading/>;
        }
        if(errorMessage){
            return( <>
                <Head>
                    <title>Smart Silo - {deviceId}</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>
                <ErrorView errorMessage={errorMessage}/>
                <div className={indexStyle.bottom_button}>
                    <Link href={"/"}>
                        <button type="button" className={"btn btn-primary rounded-pill"}>
                            トップページへ
                        </button>
                    </Link>
                </div>
            </>)
        }
        return (
            <>
                <Head>
                    <title>Smart Silo - {deviceId}</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>

                <main className={styles.main}>
                    <InfoCardView title="データがありません。サイロにあるQRコードを読み取って追加してください。" value=""/>
                </main>
                <div className={indexStyle.bottom_button}>
                    <Link href={"/user.tsx"}>
                        <button type="button" className={"btn btn-primary rounded-pill"}>
                            トップページへ
                        </button>
                    </Link>
                </div>
            </>
        )
    }

}

export const getStaticPaths: GetStaticPaths = async (context: GetStaticPropsContext<MyParams>) => {
    const filePath = path.join(process.cwd(), 'targetDevices.json');
    const data = await fsPromises.readFile(filePath);
    const devicesJson = JSON.parse(data.toString());
    const deviceList = devicesJson.center_devices.map((value: JSONDevice)=>value.id) as string[]
    return {
        paths: deviceList.map(value => {return { params: { deviceId: value } }}),
        fallback: false,
    }
}

export const getStaticProps: ({params}: { params: { deviceId:string } }) => Promise<{ props: Type3SiloConfig }|void> = async ({ params }) => {
    const deviceId = params?params.deviceId:"" as string

    const filePath = path.join(process.cwd(), 'targetDevices.json');

    const data = await fsPromises.readFile(filePath);
    const devicesJson = JSON.parse(data.toString());
    const device = devicesJson.center_devices.find((value: JSONDevice)=>value.id === deviceId) as undefined | JSONCenterDevice
    if(device){
        return {
            props: {
                silo1:devicesJson[device.silo1.type] as JSONSiloConfig,
                silo2:devicesJson[device.silo2.type] as JSONSiloConfig,
                silo3:devicesJson[device.silo3.type] as JSONSiloConfig
            }
        }
    }
    return
}


export default DevicePage;
