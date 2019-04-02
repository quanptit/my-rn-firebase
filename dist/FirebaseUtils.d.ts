export declare class FirebaseUtils {
    private static isSyncing;
    private static isCanNotDelete;
    private static isOnline;
    static initFirebase(FIRE_BASE_CONFIG: Object): void;
    static addUpdateCommand(refKey: any, value: any): Promise<void>;
    /**
     * isSkipOfflineAfterComplete: offline sau khi complete
     */
    static excuteAllWaitCommand(isSkipOfflineAfterComplete?: boolean): Promise<void>;
    static asyncDatabaseFromFirebase(): Promise<void>;
    /**Chỉ gọi hàm này một lần khi login*/
    static setUserDataAndAsyncFromFirebase(): Promise<void>;
    static saveObject(key: string | number, value: any): Promise<void>;
    static setVipUser(): Promise<void>;
    static updateTimeOpenApp(): Promise<void>;
    static goOffline(): void;
    static goOnline(): void;
}
