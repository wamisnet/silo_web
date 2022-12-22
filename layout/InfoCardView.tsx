import { CCardBody, CCardText, CCard, CButton,} from '@coreui/react'
import style from "./InfoCardView.module.css"
import {NextPage} from "next";
type Props = {
    title:string
    value:string
    alert?:boolean
    isButton?:boolean
    buttonTitle?:string
    onClickButton?: (value: string, event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>)=>void
}

const InfoCardView:NextPage<Props>  = (props) => {
    return (
        <CCard className="w-100 mb-3">
            <CCardBody className={style.status}>
                <CCardText className={style.status_text}>
                    {props.title}
                </CCardText>
                <CCardText className={props.alert?style.status_text_red:style.status_text}>
                    {props.value}
                </CCardText>
                {props.isButton?<CButton onClick={(event)=>props.onClickButton?props.onClickButton(props.value,event):""}>{props.buttonTitle}</CButton>:<></>}
            </CCardBody>
        </CCard>
  )
}

export default InfoCardView
