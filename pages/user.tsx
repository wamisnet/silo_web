import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Header from "../components/header";
import InfoCardView from "../layout/InfoCardView";
import indexStyle from "./index.module.css"
import React, {ChangeEvent, useEffect, useState} from "react";
import {
    CButton, CCard, CCardBody, CCardText, CCol, CFormInput,
    CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow
} from "@coreui/react";
import {collection, where, query, startAt, endBefore, limit, orderBy, onSnapshot} from "firebase/firestore";
import Link from "next/link";
import {DeviceInfo} from "../type/dataType";
import {auth, firestore} from "../components/Firebase";
import Loading from "../components/loading";
import ErrorView from "../layout/ErrorView";
import {toDeviceInfo} from "../type/convert";
import {useRouter} from "next/router";
import {MobileView,BrowserView} from "react-device-detect";
import {FirestoreError} from "@firebase/firestore";
import dynamic from "next/dynamic";
type FormData = {
    siloId: string
    serialNumber: string
}
export default function Home() {
    const PAGE_DATA = 25
    const [formData, setFormData] = useState<FormData>({
        siloId: "",
        serialNumber: ""
    })
    const [loading,setLoading] = useState(true)
    const [deviceInfos,setDeviceInfos] = useState<DeviceInfo[]>([])
    const [error,setError] = useState<FirestoreError | undefined>(undefined)
    const router = useRouter()
    const {page_key,siloId,serialNumber,mode} = router.query
    console.log("where",            !!siloId?"siloId":!!serialNumber?"serialNumber":"siloId",
        !!siloId ? ">=":!!serialNumber?"==":"!=",
        !!siloId?siloId:!!serialNumber?serialNumber:"")
    const isEmpty = (val:string|string[]|undefined)=>{return !val;}
    const dbQuery = query(
        collection(firestore, "v2devices"),
        where('onceUser', 'array-contains',  auth.currentUser?.uid),
        where(
            !!siloId?"siloId":!!serialNumber?"serialNumber":"siloId",
            !!siloId ? ">=":!!serialNumber?"==":"!=",
            !!siloId?siloId:!!serialNumber?serialNumber:""
        ),
        orderBy("siloId"),
        mode !== "back"?startAt(page_key?page_key:""):endBefore(page_key?page_key:""),
        limit(PAGE_DATA+1)
    )

    useEffect(()=>{
        let _siloId = "",_serialNumber = ""
        if(siloId !== undefined){
            _siloId = siloId as string
        }
        if(siloId !== undefined){
            _serialNumber = serialNumber as string
        }
       setFormData({siloId:_siloId,serialNumber:_serialNumber})

        const unsubscribe = onSnapshot(dbQuery,(snapshot)=>{
            setDeviceInfos(
                snapshot.docs.map<DeviceInfo>((value):DeviceInfo => {
                    return toDeviceInfo(value)
                })
            )
            setLoading(false);
        },(error => setError(error)))
        return () => {
            console.log("unsubscribe")
            unsubscribe()
        }
    },[page_key,mode,siloId,serialNumber])
    const Map = React.useMemo(
        () =>
            dynamic(() => import("../components/map"), {
                loading: () => <p>A map is loading</p>,
                ssr: false,
            }),
        []
    );
    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const data:FormData = { ...formData, [name]: value }
        setFormData(data)
        await router.replace({query: data}, undefined, {scroll: false,})

    }
    if(error){
        console.error(error)
        return( <>
            <Head>
                <title>Smart Silo</title>
                <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Header/>
            <ErrorView errorMessage={JSON.stringify(error)}/>
        </>)
    }

    if (loading) {
        return <Loading/>;
    }

    if(deviceInfos.length != 0) {
        const infos = mode === "back"? (deviceInfos.slice().reverse()).slice(0,PAGE_DATA) : deviceInfos.slice(0,PAGE_DATA)
        console.log("infos",mode,deviceInfos.length,page_key,siloId,serialNumber,(infos) ,deviceInfos)
        // @ts-ignore
        const list = infos.filter(value => value.gps) as {siloId:string,gps:{latitude:number,longitude:number}}[]
        const gpsList = list.map(value => {
            return {
                latitude: value.gps.latitude,
                longitude: value.gps.longitude,
                markerMessage: value.siloId,
                error:false
            }
        })
        return (
            <>
                <Head>
                    <title>Smart Silo - 一覧画面</title>
                    <meta name="description" content="昭和鋼機のサイロの重量を確認できます"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Header/>
                <main className={styles.main}>
                    <CRow className="g-3">
                        <CCol md={6}>
                            <CFormInput type="text" name="siloId"　placeholder="IDで検索" onChange={handleChange} value={formData.siloId}/>
                        </CCol>
                        <CCol md={6}>
                            <CFormInput type="text" name="serialNumber"　placeholder="管理番号で検索" onChange={handleChange} value={formData.serialNumber}/>
                        </CCol>
                    </CRow>
                    <MobileView className="mt-2">
                        {infos.map(value=> {
                            return (
                                <Link href={"/user/" + value.siloId} className={indexStyle.table_link} key={value.siloId}>
                                    <CCard className="w-100 mb-2">
                                        <CCardBody className={indexStyle.table_link} >
                                            <CCardText>
                                                ID: {value.siloId}
                                            </CCardText>
                                            <CCardText>
                                                管理番号: {value.serialNumber}
                                            </CCardText>
                                        </CCardBody>
                                    </CCard>
                                </Link>
                            )})
                        }
                    </MobileView>
                    <BrowserView>

                        <CTable striped className="g-3 mt-3">
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell scope="col">ID</CTableHeaderCell>
                                    <CTableHeaderCell scope="col">管理番号</CTableHeaderCell>
                                    <CTableHeaderCell scope="col">住所</CTableHeaderCell>
                                    <CTableHeaderCell scope="col">開始日時</CTableHeaderCell>
                                    <CTableHeaderCell scope="col">残量</CTableHeaderCell>
                                    {/*<CTableHeaderCell scope="col">サーマル(竪SC)</CTableHeaderCell>*/}
                                    {/*<CTableHeaderCell scope="col">サーマル(引出SC)</CTableHeaderCell>*/}
                                    {/*<CTableHeaderCell scope="col">電圧</CTableHeaderCell>*/}
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {infos.map(value=> {
                                    return (
                                        <CTableRow onClick={()=>{setLoading(true);router.push("/user/" + value.siloId)}} className={indexStyle.table_link} key={value.siloId}>
                                            <CTableDataCell>{value.siloId}</CTableDataCell>
                                            <CTableDataCell>{value.serialNumber}</CTableDataCell>
                                            <CTableDataCell>{value.address?value.address:"住所なし"}</CTableDataCell>
                                            <CTableDataCell>{value.currentPositionStartTime?value.currentPositionStartTime.toLocaleString():""}</CTableDataCell>
                                            <CTableDataCell>{value.scale?value.scale.active?Math.round(value.scale.weight).toLocaleString()+"kg":"未接続":value.adc?value.adc.active?value.adc.level+"%":"未接続":"未接続"}</CTableDataCell>
                                        </CTableRow>
                                    )}
                                )}
                            </CTableBody>
                        </CTable>

                        <Map
                            url="user"
                            latitude={38.39645401060089}
                            longitude={136.7340068580923}
                            list={gpsList}

                            zoom={5}
                        />


                    </BrowserView>
                    <CRow className="g-3 mt-3">
                        <CCol >
                        {(mode !== "back" && page_key !== undefined && deviceInfos.length >= PAGE_DATA) || (mode === "back" && deviceInfos.length > PAGE_DATA)?
                            <Link href={`/user/?page_key=${infos[0].siloId}&mode=back`}>
                                <CButton className={indexStyle.mr_3}>
                                    戻る
                                </CButton>
                            </Link>
                        :<></>}
                        {(mode !== "back" && deviceInfos.length > PAGE_DATA) || (mode === "back" && page_key !== undefined)?
                            <Link href={deviceInfos.length > PAGE_DATA || page_key === undefined?
                                `/user/?page_key=${deviceInfos[deviceInfos.length-1].siloId}`:
                                `/user/?page_key=${page_key}`}>
                                <CButton>
                                    次へ
                                </CButton>
                            </Link>
                        :<></>}
                        </CCol>
                    </CRow>
                </main>
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
                    <CRow className="g-3 mb-3">
                        <CCol md={6}>
                            <CFormInput type="text" name="siloId"　placeholder="IDで検索" onChange={handleChange} value={formData.siloId}/>
                        </CCol>
                        <CCol md={6}>
                            <CFormInput type="text" name="serialNumber"　placeholder="管理番号で検索" onChange={handleChange} value={formData.serialNumber}/>
                        </CCol>
                    </CRow>
                   <InfoCardView title="データがありません。サイロにあるQRコードを読み取って追加してください。" value="" />
                </main>
            </>
        )
    }

}
