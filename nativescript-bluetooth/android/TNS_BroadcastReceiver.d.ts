/// <reference path="../node_modules/tns-platform-declarations/android-27.d.ts" />
import { Bluetooth } from './android_main';
export declare class TNS_BroadcastReceiver extends android.content.BroadcastReceiver {
    private _owner;
    constructor();
    onInit(owner: WeakRef<Bluetooth>): void;
    /**
     * This method is called when the BroadcastReceiver is receiving an Intent broadcast.
     * During this time you can use the other methods on BroadcastReceiver to view/modify the current result values.
     * This method is always called within the main thread of its process, unless you explicitly asked for it to be scheduled on a different thread using registerReceiver(BroadcastReceiver, IntentFilter, String, android.os.Handler).
     * When it runs on the main thread you should never perform long-running operations in it (there is a timeout of 10 seconds that the system allows before considering the receiver to be blocked and a candidate to be killed).
     * You cannot launch a popup dialog in your implementation of onReceive().
     * @param context [android.content.Context] - The Context in which the receiver is running.
     * @param intent [android.content.Intent] - The Intent being received.
     */
    onReceive(context: android.content.Context, intent: android.content.Intent): void;
}
