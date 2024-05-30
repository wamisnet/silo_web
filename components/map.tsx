import React from "react";
import {MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import {control, icon, LatLng} from "leaflet";
import "leaflet/dist/leaflet.css";
import {NextPage} from "next";
import {ViewErrorEnum} from "../type/dataType";


const ICON_WHITE = icon({
    iconUrl: "/image/map_marker_white.png",
    iconAnchor: [23, 60],
})
const ICON_RED = icon({
    iconUrl: "/image/map_marker_red.png",
    iconAnchor: [23, 60],
})
const ICON_GREEN = icon({
    iconUrl: "/image/map_marker_green.png",
    iconAnchor: [23, 60],
})
const ICON_PINK = icon({
    iconUrl: "/image/map_marker_pink.png",
    iconAnchor: [23, 60],
})
type Props = {
    latitude: number,
    longitude: number,
    list:{
        latitude: number,
        longitude: number,
        markerMessage:string
        error:ViewErrorEnum
    }[]
    url:string
    zoom?:number
}
//38.39645401060089, 136.7340068580923
const Map:NextPage<Props> = (props) => {
    return (
        <MapContainer
            center={new LatLng(props.latitude, props.longitude)}
            zoom={props.zoom?props.zoom:13}
            scrollWheelZoom={false}
            style={{ height: "55vh", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {props.list.map(value =>
                <Marker icon={value.error == ViewErrorEnum.ERROR?ICON_RED:value.error == ViewErrorEnum.ACCEPT?ICON_GREEN:ICON_WHITE} position={[value.latitude, value.longitude]} key={value.markerMessage}>
                    <Popup>
                        <a href={`/${props.url}/${value.markerMessage}`}>{value.markerMessage}</a>
                    </Popup>
                </Marker>)
            }
        </MapContainer>
    );
};

export default Map;