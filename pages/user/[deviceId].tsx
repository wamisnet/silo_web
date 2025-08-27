import React, {useEffect, useState} from "react";
import Head from "next/head";
import {useRouter} from "next/router";
import Header from "../../components/header";
import styles from "../../styles/Home.module.css";
import InfoCardView from "../../layout/InfoCardView";
import dynamic from "next/dynamic";
import {onSnapshot,collection, query, where} from "firebase/firestore";
import {auth, firestore, functions} from "../../components/Firebase";
import {DeviceInfo, JSONDevice, JSONSiloConfig, ViewErrorEnum} from "../../type/dataType";
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
    CCol, CFormInput,
    CRow
} from "@coreui/react";
import style from "../../layout/InfoCardView.module.css";
import HistoryList from "../../components/historyList";
import SiloImage from "../../components/siloImage";
import fsPromises from 'fs/promises'
import path from "node:path";
import {Params} from "next/dist/shared/lib/router/utils/route-matcher";

import {GetStaticPaths, NextPage} from "next";
import useInterval from "use-interval";
import {httpsCallable} from "firebase/functions";
import {usePageLeaveConfirmation} from "../../components/usePageLeaveConfirmation";
const DevicePage:NextPage<JSONSiloConfig | undefined> = (props) => {
    const router = useRouter()
    const {deviceId,token} = router.query
    const [viewDetail,setViewDetail] = useState(false)
    const [loading,setLoading] = useState(true)
    const [online,setOnline] = useState(false)
    const [device,setDevice] = useState<DeviceInfo|undefined>(undefined)
    const [errorMessage,setErrorMessage] = useState("")

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
                            const device = toDeviceInfo(doc,props?.weight,props?.level)
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
    const Map = React.useMemo(
        () =>
            dynamic(() => import("../../components/map"), {
                loading: () => <p>A map is loading</p>,
                ssr: false,
            }),
        []
    );
    useInterval(()=>{
        if (device?.updatedAt != undefined) {
            const localTime = new Date();
            const differenceInMinutes = (localTime.getTime() - device.updatedAt.getTime()) / (1000 * 60)
            setOnline(Math.abs(differenceInMinutes) <= 25)
        }
    },60000)

    const [isDirty ,setDirty] = useState(false)

    const handleEditOnChange = async (event: any) => {
        setDirty(true)
        console.log("handleEditOnChange",event)
    }

    usePageLeaveConfirmation(!isDirty)

    const handleCommandSubmit = async (event: any) => {
        event.preventDefault()
        if(!isDirty)return
        let deviceInfo = device?device:{} as DeviceInfo
        deviceInfo.serialNumber = event.target.serialNumber.value
        deviceInfo.userEditName = undefined

        let maxCapacity: number = Number(event.target.silo1_max_capacity.value);
        deviceInfo.siloInfo = deviceInfo.siloInfo ?? {
            cementType: "normal",
            name: "未設定1",
            maxCapacity: 20
        }
        deviceInfo.siloInfo.maxCapacity = maxCapacity
        deviceInfo.silo2Info = deviceInfo.silo2Info ?? {
            cementType: "normal",
            name: "未設定2",
            maxCapacity: 20
        };

        deviceInfo.silo3Info = deviceInfo.silo3Info ?? {
            cementType: "normal",
            name: "未設定3",
            maxCapacity: 20
        };
        console.log(deviceInfo)
        try {
            setLoading(true)
            const requestSilo = httpsCallable(functions, 'editSiloConfig');
            await requestSilo({docId: deviceId, deviceInfo})
            // setDevice(deviceInfo)
            console.log("requestSilo success")
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



    if(device && props) {
        return (
            <>
                <Head>
                    <title>Smart Silo - {deviceId}</title>
                </Head>
                <Header/>

                <main className={styles.main}>
                    <CRow>
                        <CCol lg={4}>
                            <CCard className="mb-3">
                                <CCardHeader className={style.status_title}>
                                    基本情報
                                </CCardHeader>
                                <CCardBody>
                                    <form onSubmit={handleCommandSubmit}>
                                        <ul className={"mx-3 mb-0"}>
                                            <li>ID: {device.siloId}</li>
                                            {/*<li>管理番号: {device.serialNumber?device.serialNumber:"未設定"}</li>*/}
                                            <li>始動日: {device.currentPositionStartTime?device.currentPositionStartTime.toLocaleString():"未開始"}</li>
                                            <li>更新日: {device.updatedAt?device.updatedAt.toLocaleString():"最終更新日がありません"}</li>
                                            <li>通信状況 : {online? <div style={{ color: 'green' ,display:"contents" }}>● OK</div>: <div style={{ color: 'red' ,display:"contents" }}>× NG</div>}</li>
                                            <CFormInput id="serialNumber" label="管理番号" type="text" maxLength={20} defaultValue={device.serialNumber?device.serialNumber:"未設定"} onChange={handleEditOnChange} required className="mb-3"/>
                                            <CFormInput id="silo1_max_capacity" label="最大内容量(t)" type="number" min={1} max={100000} step={0.1} defaultValue={device.siloInfo?device.siloInfo.maxCapacity:20} onChange={handleEditOnChange} required className="mb-3"/>
                                        </ul>
                                        <CCol lg={4} className="mb-3">
                                            <button className="btn btn-outline-primary w-100 pt-3 pb-3" type="submit">保存</button>
                                        </CCol>
                                    </form>
                                    <SiloImage level={Math.round(device.viewScaleData?.level??0)} judgment={device.judgment?device.judgment.status:[false,false,false,false,false,false,false,false]} image={{
                                        base: props.baseImage,
                                        judgment: props.judgment.map(value => value.mask),
                                        level: props.levelImage?.imageMask,
                                        levelMask: props.levelImage?.progressMask
                                    }} color={{
                                        level: props.levelColor,
                                        judgment: props.judgment.map(value => {
                                            return {
                                                open:value.open.color,
                                                close:value.close.color
                                            }
                                        })
                                    }}　 />

                                    {(props.levelType === "weight" || props.levelType === "level") ?
                                        device.viewScaleData ?
                                            <CCardText
                                                className={device.viewScaleData.alert || !device.viewScaleData.active ? style.status_text_red : style.status_text}>
                                                {device.viewScaleData.active ?
                                                    <ul className={"m-3 mb-0"}>
                                                        <li><div className={style.weight_text}>在庫:{device.viewScaleData.level.toFixed()}%</div></li>
                                                        <li><div className={style.weight_text}>残量:{Math.round(device.viewScaleData.weight).toLocaleString()}kg</div></li>

                                                        <li>更新日:{device.viewScaleData.updatedAt.toLocaleString()}</li>
                                                        {/*{props.levelType === "level" ?*/}
                                                        {/*    device.viewScaleData.status === "powerOff_low" ?*/}
                                                        {/*        `センサーの電源がOFFかセンサーが異常です (${device.viewScaleData.updatedAt.toLocaleString()})` :*/}
                                                        {/*        device.viewScaleData.status === "over" ?*/}
                                                        {/*            `計測上限です (${device.viewScaleData.updatedAt.toLocaleString()})` :*/}
                                                        {/*            <>*/}
                                                        {/*                <li>レベル:{device.viewScaleData.height.toFixed(2)}m<</li>*/}
                                                        {/*                <li>更新日:{device.viewScaleData.updatedAt.toLocaleString()}</li>*/}
                                                        {/*            </>*/}
                                                        {/*            :<></>*/}
                                                        {/*}*/}

                                                    </ul> :
                                                    `残量計測機器と通信できません (${device.viewScaleData.updatedAt.toLocaleString()})`
                                                }
                                            </CCardText> :
                                            <CCardText>サイロ残量データがありません</CCardText>
                                        :<></>
                                    }
                                </CCardBody>
                            </CCard>
                        </CCol>
                        <CCol lg={viewDetail ?4:8}>
                            <CCard className="mb-3 ">
                                <CCardHeader className={style.status_title}>
                                    位置情報
                                </CCardHeader>
                                <CCardBody>
                                    {device.gps ?
                                        <>
                                            <CCardText className={!device.gps.active? style.status_text_red : style.status_text}>
                                                <ul className={"mx-3"}>
                                                    <li>現況: {device.gps.active?"位置確定":device.gps.connect?"位置確定前(最終位置を表示中)":"未接続(最終位置を表示中)"}({device.gps.updatedAt.toLocaleString()})</li>
                                                    <li>住所: {device.address?.replace(/〒?[0-9]{3}-?[0-9]{4}\s*/,"")}</li>

                                                </ul>
                                                <a href={'https://www.google.co.jp/maps/place/'+device.gps.latitude+','+device.gps.longitude}
                                                   target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary w-100 mb-3">
                                                    大きな画面で見る（GoogleMap）</a>
                                            </CCardText>
                                            <Map
                                                url="user"
                                                latitude={device.gps.latitude}
                                                longitude={device.gps.longitude}
                                                list={[{
                                                    latitude:device.gps.latitude,
                                                    longitude:device.gps.longitude,
                                                    markerMessage:device.siloId,
                                                    error:ViewErrorEnum.NONE
                                                }]}
                                            />

                                        </>:
                                        <CCardText>位置情報がありません</CCardText>
                                    }
                                </CCardBody>
                            </CCard>
                            <CButton color="secondary" variant="outline" className="w-100 mb-3" onClick={()=>setViewDetail((prevState) => !prevState)}>
                                {viewDetail?"機器詳細非表示":"機器詳細表示"}
                            </CButton>
                        </CCol>
                        {viewDetail ?
                            <CCol lg={4}>
                                <CCard className="mb-3 ">
                                    <CCardHeader className={style.status_title}>
                                        電圧計測
                                    </CCardHeader>
                                    <CCardBody>
                                        {device.power ?
                                            <CCardText
                                                className={Math.round(device.power.voltage) < 200 || Math.round(device.power.voltage) > 230 || device.power.error.high || device.power.error.low ? style.status_text_red : style.status_text}>
                                                {device.power.error.low ?
                                                    "未接続か計測下限です" :
                                                    device.power.error.high ?
                                                        "計測上限です" :
                                                        <ul className={"mx-3 mb-0"}>
                                                            <li>電圧:{device.power.voltage.toFixed()}V</li>
                                                            {/*<li>周波数:{device.power.frequency}Hz</li>*/}
                                                        </ul>
                                                }
                                            </CCardText> :
                                            <CCardText>電圧データがありません</CCardText>
                                        }
                                    </CCardBody>
                                </CCard>

                                <CCard className="mb-3 ">
                                    <CCardHeader className={style.status_title}>
                                        稼働判定
                                    </CCardHeader>
                                    <CCardBody>
                                        {device.judgment ?
                                            <>
                                                {/*最終更新日: {device.judgment.updatedAt.toLocaleString()}*/}
                                                <ul className={"mx-3 mb-0"}>
                                                    {props.judgment.map((value,index ) => {
                                                        if(device.judgment && value.active) {
                                                            return (
                                                                <li key={index}>
                                                                    {value.title}  :   {device.judgment.status[index] ?
                                                                        value.close.text : value.open.text}
                                                                </li>
                                                            )
                                                        }else {
                                                            return <></>
                                                        }
                                                    })}
                                                </ul>
                                            </> :
                                            <CCardText>稼働判定データがありません</CCardText>
                                        }
                                    </CCardBody>
                                </CCard>

                                <CCard className="mb-3">
                                    <CCardHeader className={style.status_title}>
                                        動作履歴（最新30件）
                                    </CCardHeader>
                                    <CCardBody>
                                        <HistoryList judgment={props.judgment.map(value => {
                                            return {
                                                title:value.title,
                                                open_text:value.open.text,
                                                close_text:value.close.text
                                            }
                                        })} deviceId={device.siloId}/>
                                    </CCardBody>
                                </CCard>
                            </CCol>:<></>
                        }
                    </CRow>
                </main>
                <div className={styles.buttonLayoutBase}>
                    <div className={indexStyle.bottom_button}>
                        <Link href={"/user"}>
                            <button type="button" className={"btn btn-primary rounded-pill"}>
                                一覧画面へ
                            </button>
                        </Link>
                    </div>
                </div>
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
                   <Link href={"/user"}>
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
                    <Link href={"/user"}>
                        <button type="button" className={"btn btn-primary rounded-pill"}>
                            トップページへ
                        </button>
                    </Link>
                </div>
            </>
        )
    }

}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const filePath = path.join(process.cwd(), 'targetDevices.json');

    const data = await fsPromises.readFile(filePath);
    const devicesJson = JSON.parse(data.toString());
    const deviceList = devicesJson.devices.map((value: JSONDevice)=>value.id) as string[]
    return {
        paths: deviceList.map(value => {return { params: { deviceId: value } }}),
        fallback: false,
    }
}

export const getStaticProps: ({params}: { params: { deviceId:string } }) => Promise<{ props: JSONSiloConfig }|void> = async ({ params }) => {
    const deviceId = params?params.deviceId:"" as string

    const filePath = path.join(process.cwd(), 'targetDevices.json');

    const data = await fsPromises.readFile(filePath);
    const devicesJson = JSON.parse(data.toString());
    const device = devicesJson.devices.find((value: JSONDevice)=>value.id === deviceId) as undefined | JSONDevice
    if(device){
        const data = devicesJson[device.type] as JSONSiloConfig
        console.log(JSON.stringify(data))
        return { props: data}
    }
    return
}


export default DevicePage;
