import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export const usePageLeaveConfirmation = (disabled = false) => {
    const router = useRouter()
    const [isBrowserBack, setIsBrowserBack] = useState(false)

    useEffect(() => {
        const message = 'このページから移動しますか？入力された内容は保存されません。'

        // 1. App外ページへの遷移 or ブラウザリロード
        const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
            event.preventDefault()
            // これがないとChromeなどの一部ブラウザで動作しない
            event.returnValue = ''
        }

        // 2. App内ページへの遷移
        const pageChangeHandler = () => {
            // beforePopStateで既にconfirm表示している場合はスキップ
            if (!isBrowserBack && !window.confirm(message)) {
                throw 'changeRoute aborted'
            }
        }

        // 3. App内ページへのブラウザバック
        const setBeforePopState = () => {
            router.beforePopState(() => {
                if (!confirm(message)) {
                    // 書き換わってしまったURLを戻す
                    window.history.pushState(null, '', router.asPath)
                    return false
                }
                // routeChangeStartで再度confirm表示されるのを防ぐ
                setIsBrowserBack(true)
                return true
            })
        }
        const clearBeforePopState = () => {
            router.beforePopState(() => true)
        }
        console.log("usePageLeaveConfirmation",disabled)
        if (!disabled) {
            console.log("usePageLeaveConfirmation active")
            window.addEventListener('beforeunload', beforeUnloadHandler)
            router.events.on('routeChangeStart', pageChangeHandler)
            setBeforePopState()
            return () => {
                window.removeEventListener('beforeunload', beforeUnloadHandler)
                router.events.off('routeChangeStart', pageChangeHandler)
                clearBeforePopState()
            }
        }
    }, [disabled, isBrowserBack, router])
}