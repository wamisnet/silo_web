import '../styles/globals.css'
import '@coreui/coreui/dist/css/coreui.min.css'
import type { AppProps } from 'next/app'
import {QueryClient, QueryClientProvider} from "react-query";
import {auth} from "../components/Firebase";
import { signInAnonymously,onAuthStateChanged,setPersistence } from '@firebase/auth';
import Loading from "../components/loading";
import {useState} from "react";
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
    const [isLogin,setLogin] = useState(false)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            setLogin(true)
        } else {
            setLogin(false)
            setPersistence(auth, {type: "LOCAL"}).then(_=>{})
            signInAnonymously(auth)
                .then(() => {
                    // Signed in..
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // ...
                });
        }
    })
    if(isLogin) {
        return (
            <QueryClientProvider client={queryClient}>
                <Component {...pageProps} />
            </QueryClientProvider>
        )
    }
    return <Loading/>
}
