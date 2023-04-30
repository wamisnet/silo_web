declare namespace NodeJS {
    interface ProcessEnv {
        readonly NEXT_PUBLIC_APP_FIREBASE_API_KEY: string;
        readonly NEXT_PUBLIC_APP_FIREBASE_AUTH_DOMAIN: string;
        readonly NEXT_PUBLIC_APP_FIREBASE_PROJECT_ID: string;
        readonly NEXT_PUBLIC_APP_FIREBASE_APP_ID: string;
        readonly NEXT_PUBLIC_SERVER_DOMAIN: string;
        readonly NEXT_PUBLIC_APP_BUILD_VERSION: string;
    }
}
