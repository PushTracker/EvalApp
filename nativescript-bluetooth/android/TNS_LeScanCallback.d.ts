/// <reference path="../node_modules/tns-platform-declarations/android-27.d.ts" />
import { Bluetooth } from './android_main';
/**
 * Callback interface used to deliver LE scan results.
 * https://developer.android.com/reference/android/bluetooth/BluetoothAdapter.LeScanCallback.html
 */
export declare class TNS_LeScanCallback extends android.bluetooth.BluetoothAdapter.LeScanCallback {
    private _owner;
    constructor();
    onInit(owner: WeakRef<Bluetooth>): void;
}
