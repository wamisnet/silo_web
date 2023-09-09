import Head from 'next/head'
import styles from '../styles/Home.module.css'
import cloneStyles from './clone.module.css'
import Header from "../components/header";
import React, {useState} from "react";
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
} from "@coreui/react";
import QRCode from 'react-qr-code';
import {auth, functions} from "../components/Firebase";
import {useRouter} from "next/router";
import {httpsCallable} from "firebase/functions";
import ErrorView from "../layout/ErrorView";
import indexStyle from "./index.module.css";
import Link from "next/link";
import Loading from "../components/loading";

export default function Home() {
    const origin =
        typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : '';
    const router = useRouter()
    const {token} = router.query
    console.log("token",token)
    const [checkLoading,setCheckLoading] = useState(false)
    const [errorMessage,setErrorMessage] = useState("")
    if(token){
        const requestSilo = httpsCallable(functions, 'requestAccessPermissionStatusSilo');
        requestSilo({ token })
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
        if(errorMessage){
            return( <>
                <Head>
                    <title>Smart Silo - Status Copy</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>
                <ErrorView errorMessage={errorMessage}/>
                <div className={indexStyle.bottom_button}>
                    <Link href={"/status"}>
                        <button type="button" className={"btn btn-primary rounded-pill"}>
                            トップページへ
                        </button>
                    </Link>
                </div>
            </>)
        }
        if (checkLoading) {
            console.log("loading...")
            return <Loading/>;
        }
        return (
            <>
                <Head>
                    <title>Smart Silo - Status Copy</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>

                <main className={styles.main}>
                    <CCard className={cloneStyles.clone}>
                        <CCardHeader>
                            コピーが完了しました
                        </CCardHeader>
                    </CCard>
                    <div className={indexStyle.bottom_button}>
                        <Link href={"/status"}>
                            <button type="button" className={"btn btn-primary rounded-pill"}>
                                トップページへ
                            </button>
                        </Link>
                    </div>
                </main>
            </>
        )
    }else {
        return (
            <>
                <Head>
                    <title>Smart Silo - Status Copy</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>

                <main className={styles.main}>
                    <CCard className={cloneStyles.clone}>
                        <CCardHeader>
                            コピー元のデバイスで読み取りする
                        </CCardHeader>
                        <CCardBody>
                            <QRCode value={`${origin}/clone?token=${auth.currentUser?.uid}`}/>
                        </CCardBody>
                    </CCard>
                    <div className={indexStyle.bottom_button}>
                        <Link href={"/status"}>
                            <button type="button" className={"btn btn-primary rounded-pill"}>
                                トップページへ
                            </button>
                        </Link>
                    </div>
                </main>
            </>
        )
    }
}
