import { CContainer, CCol, CRow,} from '@coreui/react'
import styles from '../styles/Home.module.css'
import {NextPage} from "next";
type Props = {
    errorMessage:string
}

const ErrorView:NextPage<Props>  = (props) => {
    return (
        <main className={styles.main}>
            <CContainer>
                <CRow className="justify-content-center">
                    <CCol md="6">
                        <div className="clearfix">
                            <h1 className="float-left display-3 mr-4">Error</h1>
                            <h4 className="pt-3 testCustom">{props.errorMessage}</h4>
                        </div>
                    </CCol>
                </CRow>
            </CContainer>
        </main>
  )
}

export default ErrorView
