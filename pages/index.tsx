import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Header from "../components/header";
import InfoCardView from "../layout/InfoCardView";
import indexStyle from "./index.module.css"
import React, {useEffect, useState} from "react"; // useEffectを追加
import {CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle} from "@coreui/react";
import {collection, where, query, onSnapshot} from "firebase/firestore"; // onSnapshotを追加
import Link from "next/link";
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
    const [deleteDevice, setDeleteDevice] = useState<DeviceInfo | undefined>(undefined)

    // --- ▼▼▼ ここから変更 ▼▼▼ ---
    // データを保持するためのStateを追加
    const [dbData, setDbData] = useState<DeviceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        // ユーザーがログインしているか確認
        if (!auth.currentUser) {
            setLoading(false);
            // ログインしていない場合は何もしない、もしくはログインページへリダイレクト
            return;
        }

        // Firestoreのクエリを作成
        const q = query(
            collection(firestore, "v2devices"),
            where('onceUser', 'array-contains', auth.currentUser.uid)
        );

        // onSnapshotでデータの変更をリッスン
        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                // 取得したドキュメントをDeviceInfoの配列に変換
                const data = querySnapshot.docs.map<DeviceInfo>((doc) => {
                    const deviceInfo = toDeviceInfo(doc);
                    const deviceConfig = props.devices.find((jsonDevice: JSONDevice) => jsonDevice.id === doc.id);
                    let config: JSONSiloConfig | undefined = undefined;
                    if (deviceConfig) {
                        // @ts-ignore
                        config = props[deviceConfig.type] as JSONSiloConfig;
                    }
                    return toDeviceInfo(doc, config?.weight, config?.level);
                });

                setDbData(data);
                setLoading(false);
            },
            (error) => {
                // エラーハンドリング
                console.error("Error fetching documents: ", error);
                setErrorMessage("データの取得中にエラーが発生しました。");
                setLoading(false);
            }
        );

        // コンポーネントがアンマウントされる時にリスナーを解除
        return () => unsubscribe();
    }, [props]); // propsが変更された場合にも再実行

    // --- ▲▲▲ ここまで変更 ▲▲▲ ---

    if (errorMessage) {
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

    if (loading || checkLoading) {
        console.log("loading...")
        return <Loading/>;
    }

    if(dbData.length > 0) {
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