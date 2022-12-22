import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAuth } from "firebase/auth";

const firebase = initializeApp( {
    apiKey: process.env.NEXT_PUBLIC_APP_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_APP_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_APP_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_APP_FIREBASE_STORAGE_BUCKET,
});
export const auth = getAuth(firebase);
export const firestore = getFirestore(firebase)
export const functions = getFunctions(firebase,"asia-northeast2");
export default firebase;
