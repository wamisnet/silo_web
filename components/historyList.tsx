import React, {useEffect, useState} from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import {NextPage} from "next";
import markerIcon from 'public/image/marker-icon.png';
import { icon } from "leaflet"
import {CTable} from "@coreui/react";
import {httpsCallable} from "firebase/functions";
import {auth, firestore, functions} from "./Firebase";
import {collection, onSnapshot, query, where,doc,limit,orderBy} from "firebase/firestore";
import {toDeviceHistory, toDeviceInfo} from "../type/convert";
import {DeviceAction, DeviceHistory, DeviceInfo, JSONSiloConfig} from "../type/dataType";
import Loading from "./loading";


type Props = {
    judgment: {
        open_text:string
        close_text:string
        title:string
    }[]
    deviceId:string
}

const HistoryList:NextPage<Props> = (props) => {
    type DeviceHistoryViewMode = {
        action:string
        createAt:string//作成日時
    }
    const [loading,setLoading] = useState(true)
    const [historyList,setHistoryList] = useState<DeviceHistoryViewMode[]>([])
    useEffect(() => {
        // Update the document title using the browser API
            const unsub = onSnapshot(
                query(
                    collection(doc(collection(firestore, "v2devices"),props.deviceId),"operation_histories"),
                    orderBy("createAt", "desc"),
                    limit(30)
                ), (query) => {
                    if(query.empty){
                        console.log("empty")
                        setHistoryList([])
                    }else {
                        const list:DeviceHistoryViewMode[] = []
                        query.forEach(doc => {
                                const data = doc.data()
                                console.log("Current data: ", data, doc.id)
                                const event = toDeviceHistory(doc)
                                event.actions.forEach((value,index) => {
                                    const inIndex = value.type !== "power"?Number(value.type.replace("IN",""))-1:0
                                        list.push({
                                            createAt: index == 0 ? event.createAt.toLocaleString() : "-",
                                            action: value.type === "power" ?
                                                `電圧:${value.value}V` :
                                                `${props.judgment[inIndex].title}:${value.value ?
                                                    props.judgment[inIndex].close_text : 
                                                    props.judgment[inIndex].open_text
                                                }`
                                        })
                                    }
                                )

                            }
                        )
                        setHistoryList(list)
                    }
                    setLoading(false)
                })
            return () => {
                unsub()
            }
    },[]);
    const columns = [
        {
            key: 'createAt',
            label: '発生時刻',
            _props: { scope: 'col' },
        },
        {
            key: 'action',
            label: '内容',
            _props: { scope: 'col' },
        },

    ]
    // const items = [
    //     {
    //         id: 1,
    //         class: 'Mark',
    //         heading_1: 'Otto',
    //         heading_2: '@mdo',
    //         _cellProps: { id: { scope: 'row' } },
    //     },
    //     {
    //         id: 2,
    //         class: 'Jacob',
    //         heading_1: 'Thornton',
    //         heading_2: '@fat',
    //         _cellProps: { id: { scope: 'row' } },
    //     },
    //     {
    //         id: 3,
    //         class: 'Larry the Bird',
    //         heading_2: '@twitter',
    //         _cellProps: { id: { scope: 'row' }, class: { colSpan: 2 } },
    //     },
    // ]
    if (loading) {
        console.log("loading...")
        return <Loading/>;
    }
    return <CTable columns={columns} items={historyList} />

};

export default HistoryList;