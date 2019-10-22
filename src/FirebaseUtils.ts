import firebase from 'firebase';
import {DataTypeUtils, isEmpty, isIOS, PreferenceUtils, sendError} from "my-rn-base-utils";
import {UserUtils} from "my-rn-login";

let database: firebase.database.Database;

export class FirebaseUtils {
    private static isSyncing: boolean;
    private static isCanNotDelete: boolean;
    private static isOnline: boolean;

    private static initFirebase(FIRE_BASE_CONFIG: Object) {
        console.log("initialize Firebase App ==========");
        try {
            if (database == null) {
                if (firebase.apps.length > 0)
                    database = firebase.apps[0].database();
                else
                    database = firebase.initializeApp(FIRE_BASE_CONFIG).database();
            }
        } catch (e) {
            sendError(e);
        }
    }

    static async addUpdateCommand(refKey, value): Promise<void> {
        if (isEmpty(refKey)) return;
        if (value === undefined) value = null;
        if (FirebaseUtils.isSyncing)
            FirebaseUtils.isCanNotDelete = true;
        let updates = await PreferenceUtils.getObject("FIREBASE_CMD") || {};
        updates[refKey] = value;
        await PreferenceUtils.saveObject("FIREBASE_CMD", updates)
    }

    /**
     * isSkipOfflineAfterComplete: offline sau khi complete
     */
    static async excuteAllWaitCommand(FIRE_BASE_CONFIG: Object, isSkipOfflineAfterComplete: boolean) {
        if (database == null && FIRE_BASE_CONFIG == null) {
            sendError("Cần gọi hàm initFirebase trước");
            return;
        }
        if (!UserUtils.isLogged()) return;
        if (FIRE_BASE_CONFIG && database == null)
            FirebaseUtils.initFirebase(FIRE_BASE_CONFIG);
        console.log("Firebase excuteAllWaitCommand");
        let updates = await PreferenceUtils.getObject("FIREBASE_CMD");
        if (!updates || FirebaseUtils.isSyncing) return;
        FirebaseUtils.isSyncing = true;
        let userRefKey = getUserRefKeyOnFirebase();
        let updateParams: { [key: string]: any } = {};
        for (let key in updates) {
            if (updates.hasOwnProperty(key)) {
                updateParams[key.format(userRefKey)] = updates[key];
            }
        }
        try {
            await FirebaseUtils.goOnline();
            await database.ref().update(updateParams);
            if (!FirebaseUtils.isCanNotDelete)
                await PreferenceUtils.deleteKey("FIREBASE_CMD");
            else
                console.log("=== TH dac biet CanNotDelete");
            console.log("excuteAllWaitCommand Complete: ", userRefKey);
        } catch (e) {
            console.log("excuteAllWaitCommand ERROR: ", e);
        }
        FirebaseUtils.isSyncing = false;
        FirebaseUtils.isCanNotDelete = false;
        if (isSkipOfflineAfterComplete) return;
        await FirebaseUtils.goOffline()
    }

    //region Đồng bộ database ở firebase về local
    static async asyncDatabaseFromFirebase() {
        if (!UserUtils.getUserObj().id || database == null) return;
        console.log("Start asyncDatabaseFromFirebase");
        await FirebaseUtils.goOnline();
        let userRefKey = getUserRefKeyOnFirebase();
        let snapshot;

        // Đồng bộ VIP user state
        snapshot = await database.ref(userRefKey + "/isVip").once('value');
        let isVip = snapshot.val();
        if (isVip)
            await UserUtils.setVipUser();

        // Đồng bộ các keys đã save Tren firebase ve database
        snapshot = await database.ref(userRefKey + "/keys").once('value');
        if (snapshot.hasChildren()) {
            let promises = [];
            snapshot.forEach(function (childSnapshot) {
                let key = childSnapshot.key;
                let childData = childSnapshot.val();
                if (childData) {
                    promises.push(PreferenceUtils.saveObject(key, childData))
                }
            });
            await Promise.all(promises)
        }

        await FirebaseUtils.excuteAllWaitCommand(null, true);
        console.log("asyncDatabaseFromFirebase Complete");
    }

    /**Chỉ gọi hàm này một lần khi login*/
    static async setUserDataAndAsyncFromFirebase() {
        if (!UserUtils.isLogged()) return;
        console.log("setUserDataAndAsyncFromFirebase");
        await FirebaseUtils.addUpdateCommand(getUserRefKeyOnFirebase() + "/user", UserUtils.getUserObj());
        await FirebaseUtils.addUpdateCommand(getRootRfStatisticStr() + getUserRefKeyOnFirebase() + "/lastTimeOpenApp",
            DataTypeUtils.getCurrentTimeSeconds());
        await FirebaseUtils.excuteAllWaitCommand(null, true);
        await FirebaseUtils.asyncDatabaseFromFirebase();
    }

    //endregion

    //region ======= Save User data =======
    static async saveObject(key: string | number, value) {
        await FirebaseUtils.addUpdateCommand(getUserRefKeyOnFirebase() + "/keys/" + key, value)
    }

    static async setVipUser() {
        await FirebaseUtils.addUpdateCommand(getUserRefKeyOnFirebase() + "/isVip", true)
    }

    static async updateTimeOpenApp() {
        if (UserUtils.isLogged())
            await FirebaseUtils.addUpdateCommand(getRootRfStatisticStr() + getUserRefKeyOnFirebase() + "/lastTimeOpenApp", DataTypeUtils.getCurrentTimeSeconds())
    }

    //endregion

    //region Utils =======
    static goOffline() {
        if (FirebaseUtils.isOnline) {
            FirebaseUtils.isOnline = false;
            database && database.goOffline();
        }
    }

    static goOnline() {
        FirebaseUtils.isOnline = true;
        database && database.goOnline();

    }

    //endregion
}

const getUserRefKeyOnFirebase = function () {
    if (UserUtils.getUserObj().id) return UserUtils.getUserObj().id.hashCode();
    return "{0}";
};

const getRootRfStatisticStr = function () {
    if (isIOS())
        return "statisticIOS/";
    return "statisticAndroid/";
};
