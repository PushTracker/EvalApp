/// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />
/// <reference path="../typings/android27.d.ts" />

import { Bluetooth } from './android_main';
import { CLog, CLogTypes } from '../common';

@JavaProxy('com.nativescript.TNS_AdvertiseCallback')
// tslint:disable-next-line:class-name
export class TNS_AdvertiseCallback extends android.bluetooth.le.AdvertiseCallback {
  private owner: WeakRef<Bluetooth>;
  constructor() {
    super();
    return global.__native(this);
  }

  onInit(owner: WeakRef<Bluetooth>) {
    this.owner = owner;
    CLog(CLogTypes.info, `---- TNS_AdvertiseCallback.onInit ---- this.owner: ${this.owner}`);
  }

  /**
   * Callback triggered in response to startAdvertising(AdvertiseSettings, AdvertiseData, AdvertiseCallback) indicating that the advertising has been started successfully.
   * @param settingsInEffect
   */
  onStartSuccess(settingsInEffect: android.bluetooth.le.AdvertiseSettings) {
    CLog(CLogTypes.info, `---- TNS_AdvertiseCallback.onStartSuccess ---- settingsInEffect: ${settingsInEffect}`);

    this.owner.get().sendEvent(Bluetooth.bluetooth_advertise_success_event);

    // this.owner.get()._onBluetoothAdvertiseResolve(settingsInEffect);
  }

  /**
   * Callback when advertising could not be started.
   * @param errorCode
   */
  onStartFailure(errorCode) {
    CLog(CLogTypes.info, `---- TNS_AdvertiseCallback.onStartFailure ---- errorCode: ${errorCode}`);

    this.owner
      .get()
      .sendEvent(
        Bluetooth.bluetooth_advertise_failure_event,
        { error: errorCode },
        'TNS_AdvertiseCallback.onStartFailure'
      );

    // this.owner.get()._onBluetoothAdvertiseReject(errorCode);
  }
}
