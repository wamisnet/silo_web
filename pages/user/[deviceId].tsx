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
    CCol,
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
const DevicePage:NextPage<JSONSiloConfig | undefined> = (props) => {
    const router = useRouter()
    const {deviceId,token} = router.query
    const [viewDetail,setViewDetail] = useState(false)
    const [loading,setLoading] = useState(true)
    const [online,setOnline] = useState(false)
    const [device,setDevice] = useState<DeviceInfo|undefined>(undefined)
    const [errorMessage,setErrorMessage] = useState("")
    // const [state, setState] = useState<number>(0);
    // useInterval(() => {
    //     setState((value) =>value >= 100?0:value + 10);
    // }, 20000);
    // <SiloImage level={state} judgment={[
    //     state===10,
    //     state===20,
    //     state===30,
    //     state===40,
    //     state===50,
    //     state===60,
    //     state===70,
    //     state===80,
    // ]}

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
                                    <ul className={"mx-3 mb-0"}>
                                        <li>ID: {device.siloId}</li>
                                        <li>管理番号: {device.serialNumber?device.serialNumber:"未設定"}</li>
                                        <li>始動日: {device.currentPositionStartTime?device.currentPositionStartTime.toLocaleString():"未開始"}</li>
                                        <li>更新日: {device.updatedAt?device.updatedAt.toLocaleString():"最終更新日がありません"}</li>
                                        <li>通信状況 : {online? <div style={{ color: 'green' ,display:"contents" }}>● OK</div>: <div style={{ color: 'red' ,display:"contents" }}>× NG</div>}</li>
                                    </ul>
                                    <SiloImage level={Math.round(props.levelType === "weight"?
                                        device.scale?(device.scale.weight / (props.weight? props.weight.max:0))*100 : 0 :
                                        device.adc?device.adc.level:0
                                    )} judgment={device.judgment?device.judgment.status:[false,false,false,false,false,false,false,false]} image={{
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

                                    {props.levelType === "weight" ?
                                        device.scale  && props.weight ?
                                            <CCardText
                                                className={device.scale.weight < props.weight.min || device.scale.weight > props.weight.max || !device.scale.active ? style.status_text_red : style.status_text}>
                                                {device.scale.active ?
                                                    <ul className={"m-3 mb-0"}>
                                                        <li><div className={style.weight_text}>重量:{Math.round(device.scale.weight).toLocaleString()}kg</div></li>
                                                        <li>更新日:{device.scale.updatedAt.toLocaleString()}</li>
                                                    </ul> :
                                                    `重量計と通信できません (${device.scale.updatedAt.toLocaleString()})`
                                                }
                                            </CCardText> :
                                            <CCardText>重量データがありません</CCardText>
                                        :<></>
                                    }
                                    {props.levelType === "level" ?
                                        device.adc && props.level?
                                            <CCardText className={!device.adc.active? style.status_text_red : style.status_text}>
                                                {props.level.alert.min > device.adc.level ?
                                                    `センサーの電源がOFFかセンサーが異常です (${device.adc.updatedAt.toLocaleString()})` :
                                                    props.level.alert.max < device.adc.level ?
                                                        `計測上限です (${device.adc.updatedAt.toLocaleString()})` :
                                                        <ul className={"m-3 mb-0"}>
                                                            <li>レベル:{((device.adc.level - props.level.min.adc) * ( props.level.max.height - props.level.min.height) / (props.level.max.adc - props.level.min.adc) + props.level.min.height).toFixed(2)}m</li>
                                                            <li>更新日:{device.adc.updatedAt.toLocaleString()}</li>
                                                        </ul>
                                                }
                                            </CCardText>:
                                            <CCardText>ADCデータがありません</CCardText>
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
                                                className={device.power.voltage < 200 || device.power.voltage > 230 || device.power.error.high || device.power.error.low ? style.status_text_red : style.status_text}>
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
