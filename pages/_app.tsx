import '../styles/globals.css'
import '@coreui/coreui/dist/css/coreui.min.css'
import type { AppProps } from 'next/app'
import {auth} from "../components/Firebase";
import { signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import Loading from "../components/loading";
import {useEffect, useState} from "react";

export default function App({ Component, pageProps }: AppProps) {
    const [isLogin, setLogin] = useState(false);
    const [isAuthenticating, setAuthenticating] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // ユーザーがログイン（または匿名認証）済み
                setLogin(true);
                setAuthenticating(false); // 認証処理完了
            } else {
                // ユーザーがいない場合、匿名認証を試みる
                setPersistence(auth, browserLocalPersistence)
                    .then(() => {
                        // 永続化設定が完了してから匿名サインインを実行
                        return signInAnonymously(auth);
                    })
                    .then(() => {
                        // 匿名認証成功。onAuthStateChangedが再度呼ばれるのを待つ
                        console.log("Signed in anonymously");
                    })
                    .catch((error) => {
                        // エラーが発生した場合も認証処理は完了とする
                        console.error("Anonymous sign-in or persistence error:", error);
                        setAuthenticating(false);
                    });
            }
        });

        return () => unsubscribe();
    }, []);

    // --- ▲▲▲ isAuthenticating の状態も考慮する ▲▲▲ ---
    if (isAuthenticating) {
        return <Loading message="認証情報を確認中..." />;
    }

    if (isLogin) {
        return <Component {...pageProps} />
    }

    // 認証に失敗した場合や、ログインしていない場合の表示
    // ここではローディングを表示し続けるか、エラーページにリダイレクトするかを選択できます
    return <Loading message="認証に失敗しました。ページを再読み込みしてください。" />;
}