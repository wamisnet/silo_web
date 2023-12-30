import React from "react";
import {MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import {control, icon, LatLng} from "leaflet";
import "leaflet/dist/leaflet.css";
import {NextPage} from "next";
import {ViewErrorEnum} from "../type/dataType";


const ICON_BLUE = icon({
    // iconUrl: "/image/map_marker_red.png",
    iconUrl: "/image/map_marker_white.png",
    iconAnchor: [23, 60],
    // iconSize: [32, 32],
})
const ICON_RED = icon({
    iconUrl: "/image/map_marker_red.png",
    iconAnchor: [23, 60],
    // iconSize: [32, 32],
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
                <Marker icon={value.error == ViewErrorEnum.ERROR?ICON_RED:value.error == ViewErrorEnum.ACCEPT?ICON_BLUE:ICON_BLUE} position={[value.latitude, value.longitude]} key={value.markerMessage}>
                    <Popup>
                        <a href={`/${props.url}/${value.markerMessage}`}>{value.markerMessage}</a>
                    </Popup>
                </Marker>)
            }
        </MapContainer>
    );
};

export default Map;