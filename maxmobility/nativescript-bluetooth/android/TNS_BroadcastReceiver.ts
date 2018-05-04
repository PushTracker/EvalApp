/// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />
/// <reference path="../typings/android27.d.ts" />

import { CLog, CLogTypes } from '../common';
import { Bluetooth } from './android_main';

@JavaProxy('com.nativescript.TNS_BroadcastReceiver')
// tslint:disable-next-line:class-name
export class TNS_BroadcastReceiver extends android.content.BroadcastReceiver {
  private _owner: WeakRef<Bluetooth>;
  constructor() {
    super();
    return global.__native(this);
  }

  onInit(owner: WeakRef<Bluetooth>) {
    this._owner = owner;
    CLog(CLogTypes.info, `---- TNS_BroadcastReceiver.onInit ---- this._owner: ${this._owner}`);
  }

  /**
   * This method is called when the BroadcastReceiver is receiving an Intent broadcast.
   * During this time you can use the other methods on BroadcastReceiver to view/modify the current result values.
   * This method is always called within the main thread of its process, unless you explicitly asked for it to be scheduled on a different thread using registerReceiver(BroadcastReceiver, IntentFilter, String, android.os.Handler).
   * When it runs on the main thread you should never perform long-running operations in it (there is a timeout of 10 seconds that the system allows before considering the receiver to be blocked and a candidate to be killed).
   * You cannot launch a popup dialog in your implementation of onReceive().
   * @param context [android.content.Context] - The Context in which the receiver is running.
   * @param intent [android.content.Intent] - The Intent being received.
   */
  onReceive(context: android.content.Context, intent: android.content.Intent) {
    const action = intent.getAction();
    const device = intent.getParcelableExtra(android.bluetooth.BluetoothDevice.EXTRA_DEVICE);
    CLog(
      CLogTypes.info,
      `TNS_BroadcastReceiver.onReceive() action: ${action}, device: ${device}, context: ${context}, intent: ${intent}`
    );
    if (!device) {
      CLog(CLogTypes.warning, `No device found in the intent: ${intent}`);
    }

    if (action === android.bluetooth.BluetoothDevice.ACTION_BOND_STATE_CHANGED) {
      const bs = intent.getIntExtra(
        android.bluetooth.BluetoothDevice.EXTRA_BOND_STATE,
        android.bluetooth.BluetoothDevice.ERROR
      );
      this._owner.get().sendEvent(Bluetooth.bond_status_change_event, { device, bs });
      // _onBondStatusChangeCallback && _onBondStatusChangeCallback(device, bs);
    } else if (action === android.bluetooth.BluetoothDevice.ACTION_NAME_CHANGED) {
      const name = intent.getIntExtra(
        android.bluetooth.BluetoothDevice.EXTRA_NAME,
        android.bluetooth.BluetoothDevice.ERROR
      );
      this._owner.get().sendEvent(Bluetooth.device_name_change_event, { device, name });
      // _onDeviceNameChangeCallback && _onDeviceNameChangeCallback(device, name);
    } else if (action === android.bluetooth.BluetoothDevice.ACTION_UUID) {
      // const uuid = intent.getIntExtra(
      //   android.bluetooth.BluetoothDevice.EXTRA_UUID,
      //   android.bluetooth.BluetoothDevice.ERROR
      // );
      const uuid = intent.getParcelableExtra(android.bluetooth.BluetoothDevice.EXTRA_UUID);
      this._owner.get().sendEvent(Bluetooth.device_uuid_change_event, { device, uuid });
      // _onDeviceUUIDChangeCallback && _onDeviceUUIDChangeCallback(device, uuid);
    } else if (action === android.bluetooth.BluetoothDevice.ACTION_ACL_DISCONNECTED) {
      this._owner.get().sendEvent(Bluetooth.device_acl_disconnected_event, { device });
      // _onDeviceACLDisconnectedCallback && _onDeviceACLDisconnectedCallback(device);
    }
  }
}
