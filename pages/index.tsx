import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Header from "../components/header";
import InfoCardView from "../layout/InfoCardView";
import indexStyle from "./index.module.css"
import React, {useState} from "react";
import {CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle} from "@coreui/react";
import {collection, where, query} from "firebase/firestore";
import Link from "next/link";
import {useFirestoreQuery} from "@react-query-firebase/firestore";
import {DeviceInfo, JSONDevice, JSONFileType, JSONSiloConfig} from "../type/dataType";
import {auth, firestore, functions} from "../components/Firebase";
import Loading from "../components/loading";
import {httpsCallable} from "firebase/functions";
import ErrorView from "../layout/ErrorView";
import {toDeviceInfo} from "../type/convert";
import fsPromises from "fs/promises";
import path from "path/posix";

export default function Home(props:JSONFileType) {
    const [isDeleteMode,setDeleteMode] = useState(false)
    const [visible, setVisible] = useState(false)
    const [checkLoading,setCheckLoading] = useState(false)
    const [errorMessage,setErrorMessage] = useState("")
    const [deleteDevice, setDeleteDevice] = useState<DeviceInfo | undefined>(undefined)
    const deviceQuery = useFirestoreQuery(
        ["v2devices"],
        query(collection(firestore, "v2devices"),where('onceUser', 'array-contains',  auth.currentUser?.uid)),
        {subscribe:true});
    if(deviceQuery.error){
        return( <>
            <Head>
                <title>Smart Silo</title>
                <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Header/>
            <ErrorView errorMessage={JSON.stringify(deviceQuery.error)}/>
        </>)
    }
    if(errorMessage){
        return( <>
            <Head>
                <title>Smart Silo</title>
                <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Header/>
            <ErrorView errorMessage={errorMessage}/>
        </>)
    }
    if ((deviceQuery.isLoading && !deviceQuery.isFetched) || checkLoading) {
        console.log("loading...")
        return <Loading/>;
    }

    if(deviceQuery.data && deviceQuery.data.docs.length != 0) {
        console.log(deviceQuery.data)
        console.log(deviceQuery.data.docs.length)
        const dbData:DeviceInfo[] = deviceQuery.data.docs.map<DeviceInfo>((value):DeviceInfo => {
            const data = toDeviceInfo(value)
            const device = props.devices.find((jsonDevice: JSONDevice)=>jsonDevice.id === value.id) as undefined | JSONDevice
            let config:JSONSiloConfig|undefined = undefined
            if(device){
                // @ts-ignore
                const data = props[device.type] as JSONSiloConfig
                console.log(JSON.stringify(data))
                config = data
            }
            return toDeviceInfo(value,config?.weight,config?.level)
        })
        return (
            <>
                <Head>
                    <title>Smart Silo</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>
                <CModal visible={visible} onClose={() => setVisible(false)}>
                    <CModalHeader>
                        <CModalTitle>次のサイロを表示しないように削除しますか？</CModalTitle>
                    </CModalHeader>
                    <CModalBody>対象:{deleteDevice?.siloId} <br/>この作業は元に戻せません。再度表示したい場合はQRの読み取りから行ってください。</CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setVisible(false)}>
                            キャンセル
                        </CButton>
                        <CButton color="primary" onClick={async ()=>{
                            try {
                                setVisible(false)
                                setCheckLoading(true)
                                const requestSilo = httpsCallable(functions, 'deleteAccessPermissionSilo');
                                await requestSilo({docId: deleteDevice?.siloId})
                                console.log("delete")
                            }catch (e:any) {
                                if(e.code == "functions/permission-denied" || e.code == "functions/invalid-argument") {
                                    setErrorMessage("読み取ったQRコードは正しくありません。")
                                }else if(e.code == "failed-precondition"){
                                    setErrorMessage("再度開きなおすか、ブラウザをリセットしてください。")
                                }else{
                                    setErrorMessage("予期しないエラーが発生しました。オンラインになっているか確認したのち再度開きなおすか、ブラウザをリセットしてください。")
                                }
                            }finally {
                                setCheckLoading(false)
                            }
                        }}>削除</CButton>
                    </CModalFooter>
                </CModal>
                <main className={styles.main}>
                    {dbData.map(value=> {
                        console.log("db",value)
                            return (<Link href={isDeleteMode?"#":"/device/" + value.siloId} className="link-clear" key={value.siloId}>
                                <InfoCardView
                                    title={value.siloId}
                                    value={value.viewScaleData?.active ? `${Math.round(value.viewScaleData.weight).toLocaleString()} kg`:"重量データがありません"}
                                    alert={value.viewScaleData?.alert || !value.viewScaleData?.active}
                                    isButton={isDeleteMode}
                                      buttonTitle="削除"
                                    onClickButton={(deviceName: string,event:any) => {
                                       event.stopPropagation()
                                       setDeleteDevice(value);
                                       setVisible(true);
                                       console.log("delete dialog", deviceName)
                                   }}/>
                            </Link>)
                        }
                    )}
                </main>
                <div className={indexStyle.bottom_button}>
                    <button type="button" className={"btn btn-primary rounded-pill"} onClick={()=>setDeleteMode(!isDeleteMode)}>
                        {isDeleteMode?"キャンセル":"削除"}
                    </button>
                </div>
            </>
        )
    }else{
        return (
            <>
                <Head>
                    <title>Smart Silo</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>

                <main className={styles.main}>
                   <InfoCardView title="データがありません。サイロにあるQRコードを読み取って追加してください。" value=""/>
                </main>
            </>
        )
    }

}
export const getStaticProps: () => Promise<{ props: JSONFileType }> = async () => {
    const filePath = path.join(process.cwd(), 'targetDevices.json');

    const data = await fsPromises.readFile(filePath);
    const devicesJson = JSON.parse(data.toString());
    return { props: devicesJson as JSONFileType}
}
