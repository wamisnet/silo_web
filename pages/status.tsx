import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Header from "../components/header";
import InfoCardView from "../layout/InfoCardView";
import indexStyle from "./index.module.css"
import React, {useEffect, useState} from "react";
import {CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle} from "@coreui/react";
// onSnapshot を追加
import {collection, where, query, startAfter, limit, orderBy, onSnapshot, Query} from "firebase/firestore";
import Link from "next/link";
import {DeviceInfo} from "../type/dataType";
import {auth, firestore, functions} from "../components/Firebase";
import Loading from "../components/loading";
import {httpsCallable} from "firebase/functions";
import ErrorView from "../layout/ErrorView";
import {toDeviceInfo} from "../type/convert";
import {useRouter} from "next/router";
// useDocumentQuery のインポートを削除
// import {useDocumentQuery} from "@tanstack-query-firebase/react/firestore";

export default function Home() {
    const [isDeleteMode,setDeleteMode] = useState(false)
    const [visible, setVisible] = useState(false)
    const [checkLoading,setCheckLoading] = useState(false)
    const [deleteDevice, setDeleteDevice] = useState<DeviceInfo | undefined>(undefined)
    const router = useRouter()
    const {page_key} = router.query
    console.log("page_key index ",page_key?page_key:"")

    // --- ▼▼▼ ここから変更 ▼▼▼ ---
    const [dbData, setDbData] = useState<DeviceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        // router.isReady が false の場合や、ユーザーがログインしていない場合は処理を中断
        if (!router.isReady || !auth.currentUser) {
            // ユーザーがいない場合はローディングを止め、何も表示しない
            if (!auth.currentUser) {
                setLoading(false);
            }
            return;
        }

        setLoading(true);

        // ベースとなるクエリを作成
        const baseQuery = query(
            collection(firestore, "v2devices"),
            where('onceUser', 'array-contains',  auth.currentUser.uid),
            orderBy("siloId")
        );

        // page_key の有無に応じて、最終的なクエリを構築
        const finalQuery = page_key
            ? query(baseQuery, startAfter(page_key), limit(25))
            : query(baseQuery, limit(25));

        // onSnapshotでデータの変更をリッスン
        const unsubscribe = onSnapshot(finalQuery,
            (querySnapshot) => {
                const data = querySnapshot.docs.map<DeviceInfo>((doc) => toDeviceInfo(doc));
                setDbData(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching documents: ", error);
                setErrorMessage("データの取得中にエラーが発生しました。");
                setLoading(false);
            }
        );

        // コンポーネントがアンマウントされる時、または page_key が変わる時にリスナーを解除
        return () => unsubscribe();

    }, [router.isReady, page_key]); // router.isReady と page_key を依存配列に追加

    // --- ▲▲▲ ここまで変更 ▲▲▲ ---

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

    if (loading || checkLoading) {
        console.log("loading...")
        return <Loading/>;
    }

    if(dbData.length > 0) {
        console.log(dbData)
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
                            return (<Link href={isDeleteMode?"#":"/status/" + value.siloId} className="link-clear" key={value.siloId}>
                                <InfoCardView
                                    title={value.siloId}
                                    value={value.scale && value.scale.active?`${value.scale.weight.toLocaleString()} kg`:"重量データがありません"}
                                    alert={value.scale && value.scale.active && value.scale.weight < 4000}
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
                    <button type="button" className={"btn btn-primary rounded-pill "} onClick={()=>location.href='/clone'}>
                        更新
                    </button>
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