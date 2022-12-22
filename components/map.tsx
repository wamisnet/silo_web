import React from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import {NextPage} from "next";

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { icon } from "leaflet"


const ICON = icon({
    iconUrl: markerIcon.src,
    iconAnchor: [13, 42],
    // iconSize: [32, 32],
})
type Props = {
    latitude: number,
    longitude: number,
    markerMessage:string
}

const Map:NextPage<Props> = (props) => {
    return (
        <MapContainer
            center={new LatLng(props.latitude, props.longitude)}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "50vh", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker icon={ICON} position={[props.latitude, props.longitude]}>
                <Popup>
                    {props.markerMessage}
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default Map;