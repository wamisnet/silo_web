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
import { httpsCallable } from "firebase/functions";
import ErrorView from "../../layout/ErrorView";
import indexStyle from "../index.module.css";
import Link from "next/link";
import {toDeviceInfo} from "../../type/convert";
import {GetStaticPaths, NextPage} from "next";
import {Params} from "next/dist/shared/lib/router/utils/route-matcher";
import path from "node:path";
import fsPromises from "fs/promises";

const DevicePage:NextPage<JSONSiloConfig | undefined> = (props) => {
    const router = useRouter()
    const {deviceId,token} = router.query
    console.log("deviceId",deviceId)
    console.log("token",token)
    const [loading,setLoading] = useState(true)
    const [checkLoading,setCheckLoading] = useState(false)
    const [errorMessage,setErrorMessage] = useState("")
    const [device,setDevice] = useState<DeviceInfo|undefined>(undefined)
    useEffect(() => {
        // Update the document title using the browser API
        if(router.isReady && deviceId) {
            console.log("fast token", token)
            console.log("fast token", deviceId)
            if(token) {
                setCheckLoading(true)

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
                    }).finally(() => setCheckLoading(false))
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
                                setDevice(toDeviceInfo(doc,props?.weight,props?.level))
                            }
                        )
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

    if(device) {
        return (
            <>
                <Head>
                    <title>Smart Silo - {deviceId}</title>
                </Head>
                <Header/>

                <main className={styles.main}>
                    <InfoCardView
                        title={device.siloId}
                        value={device.viewScaleData?.active === true ?`${Math.round(device.viewScaleData.weight).toLocaleString()} kg`:"重量データがありません"}
                        alert={device.viewScaleData?.alert}/>
                    {device.gps?
                        <Map
                            url="device"
                            latitude={device.gps.latitude}
                            longitude={device.gps.longitude}
                            list={[{
                                latitude:device.gps.latitude,
                                longitude:device.gps.longitude,
                                markerMessage:device.siloId,
                                error:ViewErrorEnum.NONE}]}
                        />:<p>位置情報がありません</p>
                    }

                </main>
                <div className={indexStyle.bottom_button}>
                    <Link href={"/"}>
                        <button type="button" className={"btn btn-primary rounded-pill"}>
                            トップページへ
                        </button>
                    </Link>
                </div>
            </>
        );
    }else{
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
        if (loading || checkLoading) {
            console.log("loading...")
            return <Loading/>;
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
                    <Link href={"/"}>
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
