/// <reference path="../node_modules/tns-platform-declarations/android-27.d.ts" />
import { Bluetooth } from './android_main';
/**
 * Bluetooth LE scan callbacks. Scan results are reported using these callbacks.
 * https://developer.android.com/reference/android/bluetooth/le/ScanCallback.html
 */
export declare class TNS_ScanCallback extends android.bluetooth.le.ScanCallback {
    private _owner;
    constructor();
    onInit(owner: WeakRef<Bluetooth>): void;
    /**
     * Callback when batch results are delivered.
     * @param results [List<android.bluetooth.le.ScanResult>] - List of scan results that are previously scanned.
     */
    onBatchScanResults(results: any): void;
    /**
     * Callback when scan could not be started.
     * @param errorCode [number] - Error code (one of SCAN_FAILED_*) for scan failure.
     */
    onScanFailed(errorCode: number): void;
    /**
     * Callback when a BLE advertisement has been found.
     * @param callbackType [number] - Determines how this callback was triggered. Could be one of CALLBACK_TYPE_ALL_MATCHES, CALLBACK_TYPE_FIRST_MATCH or CALLBACK_TYPE_MATCH_LOST
     * @param result  [android.bluetooth.le.ScanResult] - A Bluetooth LE scan result.
     */
    onScanResult(callbackType: number, result: android.bluetooth.le.ScanResult): void;
}
