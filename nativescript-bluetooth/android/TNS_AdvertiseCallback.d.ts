/// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />
import { Bluetooth } from './android_main';
export declare class TNS_AdvertiseCallback extends android.bluetooth.le.AdvertiseCallback {
    private _owner;
    constructor();
    onInit(owner: WeakRef<Bluetooth>): void;
    /**
     * Callback triggered in response to startAdvertising(AdvertiseSettings, AdvertiseData, AdvertiseCallback) indicating that the advertising has been started successfully.
     * @param settingsInEffect
     */
    onStartSuccess(settingsInEffect: android.bluetooth.le.AdvertiseSettings): void;
    /**
     * Callback when advertising could not be started.
     * @param errorCode
     */
    onStartFailure(errorCode: number): void;
}
