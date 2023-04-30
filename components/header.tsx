import {CHeader, CHeaderNav,CNavLink, CNavItem,} from '@coreui/react'
import Link from "next/link";
const Header = () => {
    return (
        <CHeader>
            <CHeaderNav className="position-relative m-auto">
                <CNavItem className="px-3">
                    <Link href={"/"} className="link-clear nav-link">
                        Smart Silo
                    </Link>
                </CNavItem>

            </CHeaderNav>
            <p id="version">{process.env.NEXT_PUBLIC_APP_BUILD_VERSION}</p>
        </CHeader>
    )
}

export default Header
