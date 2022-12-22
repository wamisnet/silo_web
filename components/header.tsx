import {CHeader, CHeaderNav,CNavLink, CNavItem,} from '@coreui/react'
import Link from "next/link";
const Header = () => {
    return (
        <CHeader>
            <CHeaderNav className=" m-auto">
                <CNavItem className="px-3">
                    <Link href={"/"} className="link-clear nav-link">
                        Smart Silo
                    </Link>
                </CNavItem>
            </CHeaderNav>
        </CHeader>
    )
}

export default Header
