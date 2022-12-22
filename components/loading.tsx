import ReactLoading from "react-loading";
import style from "./loging.module.css"
import {NextPage} from "next";
type Props = {
    message?:string
}

const Loading: NextPage<Props> = (props ) =>{
    return (
        <div className={style.loading}>
            <div className={style.center}>
                <ReactLoading type="spin" color="#fff" className={style.center}/>
                <p>{props.message? props.message:"Loading..."}</p>
            </div>
        </div>
        )
}

export default Loading;