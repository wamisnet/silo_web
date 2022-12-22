// 2点間の距離を計算する
// https://qiita.com/kawanet/items/a2e111b17b8eb5ac859a

import {GeoPoint} from "@google-cloud/firestore";

const R = Math.PI / 180;
export const distance = (locationBase:GeoPoint, location:GeoPoint) => {
    let lat1,lng1,lat2,lng2;
    lat1 = locationBase.latitude * R;
    lng1 = locationBase.longitude * R;
    lat2 = location.latitude * R;
    lng2 = location.longitude * R;
    return 6371 * Math.acos(Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1) + Math.sin(lat1) * Math.sin(lat2));
}