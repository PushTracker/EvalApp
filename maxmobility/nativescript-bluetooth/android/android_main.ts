// /// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />
/// <reference path="../typings/android27.d.ts" />

import * as utils from 'tns-core-modules/utils/utils';
import * as application from 'tns-core-modules/application';
import {
  BluetoothCommon,
  CLog,
  CLogTypes,
  StopNotifyingOptions,
  StartNotifyingOptions,
  ConnectOptions,
  StartScanningOptions,
  StartAdvertisingOptions,
  DisconnectOptions,
  WriteOptions,
  ReadOptions
} from '../common';
import { TNS_AdvertiseCallback } from './TNS_AdvertiseCallback';
import { TNS_BluetoothGattServerCallback } from './TNS_BluetoothGattServerCallback';
import { TNS_BluetoothGattCallback } from './TNS_BluetoothGattCallback';
import { TNS_ScanCallback } from './TNS_ScanCallback';
import { TNS_LeScanCallback } from './TNS_LeScanCallback';
import { TNS_BroadcastReceiver } from './TNS_BroadcastReceiver';

const ACCESS_COARSE_LOCATION_PERMISSION_REQUEST_CODE = 222;
const ACTION_REQUEST_ENABLE_BLUETOOTH_REQUEST_CODE = 223;
const ACTION_REQUEST_BLUETOOTH_DISCOVERABLE_REQUEST_CODE = 224;

// PERIPHERAL MODE START

// const _onBluetoothAdvertiseResolve = null;
// const _onBluetoothAdvertiseReject = null;
// const _onServerConnectionStateChangeCallback = null;
// const _onBondStatusChangeCallback = null;
// const _onDeviceNameChangeCallback = null;
// const _onDeviceUUIDChangeCallback = null;
// const _onDeviceACLDisconnectedCallback = null;
// const _onCharacteristicWriteRequestCallback = null;
// const _onCharacteristicReadRequestCallback = null;
// const _onDescriptorWriteRequestCallback = null;
// const _onDescriptorReadRequestCallback = null;

// PERIPHERAL MODE STOP

export class Bluetooth extends BluetoothCommon {
  // @link - https://developer.android.com/reference/android/content/Context.html#BLUETOOTH_SERVICE
  public bluetoothManager: android.bluetooth.BluetoothManager = utils.ad
    .getApplicationContext()
    .getSystemService(android.content.Context.BLUETOOTH_SERVICE);
  public adapter: android.bluetooth.BluetoothAdapter = this.bluetoothManager.getAdapter();
  public gattServer: android.bluetooth.BluetoothGattServer;
  public bluetoothGattServerCallback = new TNS_BluetoothGattServerCallback();
  public bluetoothGattCallback = new TNS_BluetoothGattCallback();
  public advertiseCallback = new TNS_AdvertiseCallback();

  // not initializing here, if the Android API is < 21  use LeScanCallback
  public scanCallback: TNS_ScanCallback;
  public LeScanCallback: TNS_LeScanCallback;
  public broadcastReceiver: TNS_BroadcastReceiver;
  public onDiscovered;

  /**
   * Connections are stored as key-val pairs of UUID-Connection.
   * So something like this:
   * [{
   *   34343-2434-5454: {
   *     state: 'connected',
   *     discoveredState: '',
   *     operationConnect: someCallbackFunction
   *   },
   *   1323213-21321323: {
   *     ..
   *   }
   * }, ..]
   */
  public connections = {};
  // private _onBluetoothEnabledResolve;
  // private _onBluetoothDiscoverableResolve = null;

  constructor() {
    super();
    CLog(CLogTypes.info, '*** Android Bluetooth Constructor ***');
    CLog(CLogTypes.info, 'this.bluetoothManager', this.bluetoothManager);
    CLog(CLogTypes.info, 'this.adapter', this.adapter);

    // android.os.Build.VERSION_CODES.LOLLIPOP
    if (android.os.Build.VERSION.SDK_INT >= 21) {
      this.bluetoothGattServerCallback.onInit(new WeakRef(this));
      this.advertiseCallback.onInit(new WeakRef(this));
      this.scanCallback = new TNS_ScanCallback();
      this.scanCallback.onInit(new WeakRef(this));
      this.broadcastReceiver = new TNS_BroadcastReceiver();
      this.broadcastReceiver.onInit(new WeakRef(this));

      const deviceChangeIntent = new android.content.IntentFilter();
      deviceChangeIntent.addAction(android.bluetooth.BluetoothDevice.ACTION_BOND_STATE_CHANGED);
      deviceChangeIntent.addAction(android.bluetooth.BluetoothDevice.ACTION_NAME_CHANGED);
      deviceChangeIntent.addAction(android.bluetooth.BluetoothDevice.ACTION_UUID);
      deviceChangeIntent.addAction(android.bluetooth.BluetoothDevice.ACTION_ACL_DISCONNECTED);
      // register the broadcast receiver
      utils.ad.getApplicationContext().registerReceiver(this.broadcastReceiver, deviceChangeIntent);
    } else {
      this.LeScanCallback = new TNS_LeScanCallback();
      this.LeScanCallback.onInit(new WeakRef(this));
    }

    this.bluetoothGattCallback.onInit(new WeakRef(this));
  }

  public coarseLocationPermissionGranted() {
    let hasPermission = android.os.Build.VERSION.SDK_INT < 23; // Android M. (6.0)
    if (!hasPermission) {
      hasPermission =
        android.content.pm.PackageManager.PERMISSION_GRANTED ===
        (android.support.v4.content.ContextCompat as any).checkSelfPermission(
          application.android.foregroundActivity,
          android.Manifest.permission.ACCESS_COARSE_LOCATION
        );
    }
    CLog(CLogTypes.info, 'ACCESS_COARSE_LOCATION permission granted?', hasPermission);
    return hasPermission;
  }

  public requestCoarseLocationPermission(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // grab the permission dialog result
      application.android.on(
        application.AndroidApplication.activityRequestPermissionsEvent,
        (args: application.AndroidActivityRequestPermissionsEventData) => {
          for (let i = 0; i < args.permissions.length; i++) {
            if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_DENIED) {
              reject('Permission denied');
              return;
            }
          }
          resolve();
        }
      );

      // invoke the permission dialog
      (android.support.v4.app.ActivityCompat as any).requestPermissions(
        application.android.foregroundActivity,
        [android.Manifest.permission.ACCESS_COARSE_LOCATION],
        ACCESS_COARSE_LOCATION_PERMISSION_REQUEST_CODE
      );
    });
  }

  public enable() {
    return new Promise((resolve, reject) => {
      try {
        // _onBluetoothEnabledResolve = resolve;

        // activityResult event
        const onBluetoothEnableResult = (args: application.AndroidActivityResultEventData) => {
          if (args.requestCode === ACTION_REQUEST_ENABLE_BLUETOOTH_REQUEST_CODE) {
            try {
              if (args.requestCode === ACTION_REQUEST_ENABLE_BLUETOOTH_REQUEST_CODE) {
                this._onBluetoothEnabledResolve(args.resultCode === -1);
              } else if (args.requestCode === ACTION_REQUEST_BLUETOOTH_DISCOVERABLE_REQUEST_CODE) {
                this._onBluetoothDiscoverableResolve(args.resultCode === -1);
              }

              const data = args.intent;

              application.android.off(application.AndroidApplication.activityResultEvent, onBluetoothEnableResult);
              resolve(true);
              return; // yay
            } catch (e) {
              CLog(CLogTypes.error, e);
              application.android.off(application.AndroidApplication.activityResultEvent, onBluetoothEnableResult);
              reject(e);
              this.sendEvent(Bluetooth.error_event, e, 'Error with the enable bluetooth result.');
              return;
            }
          } else {
            application.android.off(application.AndroidApplication.activityResultEvent, onBluetoothEnableResult);
            reject(`Image picker activity result code ${args.resultCode}`);
            return;
          }
        };

        // set the onImagePickerResult for the intent
        application.android.on(application.AndroidApplication.activityResultEvent, onBluetoothEnableResult);

        application.android.on(
          application.AndroidApplication.activityResultEvent,
          (data: application.AndroidActivityResultEventData) => {
            if (data.requestCode === ACTION_REQUEST_ENABLE_BLUETOOTH_REQUEST_CODE) {
              this.sendEvent(Bluetooth.bluetooth_enabled_event, data.resultCode, 'Bluetooth Enabled Event');
              this._onBluetoothEnabledResolve(data.resultCode === -1);
              _onBluetoothEnabledResolve = undefined;
            } else if (data.requestCode === ACTION_REQUEST_BLUETOOTH_DISCOVERABLE_REQUEST_CODE) {
              this._onBluetoothDiscoverableResolve(data.resultCode === -1);
              _onBluetoothDiscoverableResolve = undefined;
            }
          }
        );

        const intent = new android.content.Intent(android.bluetooth.BluetoothAdapter.ACTION_REQUEST_ENABLE);
        application.android.foregroundActivity.startActivityForResult(
          intent,
          ACTION_REQUEST_ENABLE_BLUETOOTH_REQUEST_CODE
        );
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.enable: ${ex}`);
        reject(ex);
        this.sendEvent(Bluetooth.error_event, ex, 'Error enabling bluetooth.');
      }
    });
  }

  public isBluetoothEnabled() {
    return new Promise((resolve, reject) => {
      try {
        resolve(this._isEnabled());
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.isBluetoothEnabled: ${ex}`);
        reject(ex);
      }
    });
  }

  public startScanning(arg: StartScanningOptions) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._isEnabled()) {
          reject('Bluetooth is not enabled');
          return;
        }

        if (arg.skipPermissionCheck !== true && !this.coarseLocationPermissionGranted()) {
          CLog(CLogTypes.info, 'Coarse Location Permission not granted on Android device, will request permission.');
          this.requestCoarseLocationPermission();
        } else {
          onPermissionGranted();
        }

        const onPermissionGranted = () => {
          this.connections = {};

          const serviceUUIDs = arg.serviceUUIDs || [];
          const uuids = [];
          for (const s in serviceUUIDs) {
            if (s) {
              uuids.push(this.stringToUuid(serviceUUIDs[s]));
            }
          }

          // if less than Android21 (Lollipop)
          if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.LOLLIPOP) {
            const didStart =
              uuids.length === 0
                ? this.adapter.startLeScan(this.LeScanCallback)
                : this.adapter.startLeScan(uuids, this.LeScanCallback);
            CLog(CLogTypes.info, `didStart scanning: ${didStart}`);

            if (!didStart) {
              // TODO error msg, see https://github.com/randdusing/cordova-plugin-bluetoothle/blob/master/src/android/BluetoothLePlugin.java#L758
              reject("Scanning didn't start");
              return;
            }
          } else {
            let scanFilters = null as java.util.ArrayList;
            if (uuids.length > 0) {
              scanFilters = new java.util.ArrayList();
              for (const u in uuids) {
                if (u) {
                  const theUuid = uuids[u];
                  const scanFilterBuilder = new android.bluetooth.le.ScanFilter.Builder();
                  scanFilterBuilder.setServiceUuid(new android.os.ParcelUuid(theUuid));
                  scanFilters.add(scanFilterBuilder.build());
                }
              }
            }

            // ga hier verder: https://github.com/randdusing/cordova-plugin-bluetoothle/blob/master/src/android/BluetoothLePlugin.java#L775
            const scanSettings = new android.bluetooth.le.ScanSettings.Builder();
            scanSettings.setReportDelay(0);

            const scanMode = arg.android.scanMode || android.bluetooth.le.ScanSettings.SCAN_MODE_LOW_LATENCY;
            scanSettings.setScanMode(scanMode);

            // if >= Android23 (Marshmallow)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
              const matchMode = arg.android.matchMode || android.bluetooth.le.ScanSettings.MATCH_MODE_AGGRESSIVE;
              scanSettings.setMatchMode(matchMode);

              const matchNum = arg.android.matchNum || android.bluetooth.le.ScanSettings.MATCH_NUM_MAX_ADVERTISEMENT;
              scanSettings.setNumOfMatches(matchNum);

              const callbackType =
                arg.android.callbackType || android.bluetooth.le.ScanSettings.CALLBACK_TYPE_ALL_MATCHES;
              scanSettings.setCallbackType(callbackType);
            }

            this.adapter.getBluetoothLeScanner().startScan(scanFilters, scanSettings.build(), this.scanCallback);
          }

          // TODO: enable this for back compat if people don't like using the event listener approach
          // onDiscovered = arg.onDiscovered;

          if (arg.seconds) {
            setTimeout(() => {
              // note that by now a manual 'stop' may have been invoked, but that doesn't hurt
              // if < Android21 (Lollipop)
              if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.LOLLIPOP) {
                this.adapter.stopLeScan(this.LeScanCallback);
              } else {
                this.adapter.getBluetoothLeScanner().stopScan(this.scanCallback);
              }
              resolve();
            }, arg.seconds * 1000);
          } else {
            resolve();
          }
        };
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.startScanning: ${ex}`);
        reject(ex);
      }
    });
  }

  public stopScanning() {
    return new Promise((resolve, reject) => {
      try {
        if (!this._isEnabled()) {
          reject('Bluetooth is not enabled');
          return;
        }

        // if less than Android21(Lollipop)
        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.LOLLIPOP) {
          this.adapter.stopLeScan(this.LeScanCallback);
        } else {
          this.adapter.getBluetoothLeScanner().stopScan(this.scanCallback);
        }
        resolve();
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.stopScanning: ${ex}`);
        reject(ex);
      }
    });
  }

  // note that this doesn't make much sense without scanning first
  public connect(arg: ConnectOptions) {
    return new Promise((resolve, reject) => {
      try {
        // or macaddress..
        if (!arg.UUID) {
          reject('No UUID was passed');
          return;
        }
        const bluetoothDevice = this.adapter.getRemoteDevice(arg.UUID);
        if (bluetoothDevice === null) {
          reject('Could not find peripheral with UUID ' + arg.UUID);
        } else {
          CLog(CLogTypes.info, `Connecting to peripheral with UUID: ${arg.UUID}`);

          let gatt;

          // if less than Android23(Marshmallow)
          if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.M) {
            gatt = bluetoothDevice.connectGatt(
              utils.ad.getApplicationContext(), // context
              false, // autoconnect
              new this.MyGattCallback()
            );
          } else {
            gatt = bluetoothDevice.connectGatt(
              utils.ad.getApplicationContext(), // context
              false, // autoconnect
              new this.MyGattCallback(),
              android.bluetooth.BluetoothDevice.TRANSPORT_LE // 2
            );
          }

          this.connections[arg.UUID] = {
            state: 'connecting',
            onConnected: arg.onConnected,
            onDisconnected: arg.onDisconnected,
            device: gatt // TODO rename device to gatt?
          };
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.connect: ${ex}`);
        reject(ex);
      }
    });
  }

  public disconnect(arg: DisconnectOptions) {
    return new Promise((resolve, reject) => {
      try {
        if (!arg.UUID) {
          reject('No UUID was passed');
          return;
        }
        const connection = this.connections[arg.UUID];
        if (!connection) {
          reject("Peripheral wasn't connected");
          return;
        }

        this.gattDisconnect(connection.device);
        resolve();
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.disconnect: ${ex}`);
        reject(ex);
      }
    });
  }

  public read(arg: ReadOptions) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(arg, reject);
        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const gatt = wrapper.gatt;
        const bluetoothGattService = wrapper.bluetoothGattService;
        const characteristicUUID = this.stringToUuid(arg.characteristicUUID);

        const bluetoothGattCharacteristic = this._findCharacteristicOfType(
          bluetoothGattService,
          characteristicUUID,
          android.bluetooth.BluetoothGattCharacteristic.PROPERTY_READ
        );
        if (!bluetoothGattCharacteristic) {
          reject(
            'Could not find characteristic with UUID ' +
              arg.characteristicUUID +
              ' on service with UUID ' +
              arg.serviceUUID +
              ' on peripheral with UUID ' +
              arg.peripheralUUID
          );
          return;
        }

        const stateObject = this.connections[arg.peripheralUUID];
        stateObject.onReadPromise = resolve;
        if (!gatt.readCharacteristic(bluetoothGattCharacteristic)) {
          reject('Failed to set client characteristic read for ' + characteristicUUID);
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.read: ${ex}`);
        reject(ex);
      }
    });
  }

  public write(arg: WriteOptions) {
    return new Promise((resolve, reject) => {
      try {
        if (!arg.value) {
          reject("You need to provide some data to write in the 'value' property");
          return;
        }
        const wrapper = this._getWrapper(arg, reject);
        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const bluetoothGattCharacteristic = this._findCharacteristicOfType(
          wrapper.bluetoothGattService,
          this.stringToUuid(arg.characteristicUUID),
          android.bluetooth.BluetoothGattCharacteristic.PROPERTY_WRITE
        );
        if (!bluetoothGattCharacteristic) {
          reject(
            'Could not find characteristic with UUID ' +
              arg.characteristicUUID +
              ' on service with UUID ' +
              arg.serviceUUID +
              ' on peripheral with UUID ' +
              arg.peripheralUUID
          );
          return;
        }

        const val = this.encodeValue(arg.value);
        if (val === null) {
          reject('Invalid value: ' + arg.value);
          return;
        }

        bluetoothGattCharacteristic.setValue(val);
        bluetoothGattCharacteristic.setWriteType(android.bluetooth.BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);

        this.connections[arg.peripheralUUID].onWritePromise = resolve;
        if (!wrapper.gatt.writeCharacteristic(bluetoothGattCharacteristic)) {
          reject('Failed to write to characteristic ' + arg.characteristicUUID);
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.write: ${ex}`);
        reject(ex);
      }
    });
  }

  public writeWithoutResponse(arg: WriteOptions) {
    return new Promise((resolve, reject) => {
      try {
        if (!arg.value) {
          reject("You need to provide some data to write in the 'value' property");
          return;
        }
        const wrapper = this._getWrapper(arg, reject);
        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const bluetoothGattCharacteristic = this._findCharacteristicOfType(
          wrapper.bluetoothGattService,
          this.stringToUuid(arg.characteristicUUID),
          android.bluetooth.BluetoothGattCharacteristic.PROPERTY_WRITE
        );
        if (!bluetoothGattCharacteristic) {
          reject(
            'Could not find characteristic with UUID ' +
              arg.characteristicUUID +
              ' on service with UUID ' +
              arg.serviceUUID +
              ' on peripheral with UUID ' +
              arg.peripheralUUID
          );
          return;
        }

        const val = this.encodeValue(arg.value);
        if (val === null) {
          reject('Invalid value: ' + arg.value);
          return;
        }

        bluetoothGattCharacteristic.setValue(val);
        bluetoothGattCharacteristic.setWriteType(android.bluetooth.BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE);

        if (wrapper.gatt.writeCharacteristic(bluetoothGattCharacteristic)) {
          resolve();
        } else {
          reject('Failed to write to characteristic ' + arg.characteristicUUID);
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.writeWithoutResponse: ${ex}`);
        reject(ex);
      }
    });
  }

  public startNotifying(arg: StartNotifyingOptions) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(arg, reject);
        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const gatt = wrapper.gatt;
        const bluetoothGattService = wrapper.bluetoothGattService;
        const characteristicUUID = this.stringToUuid(arg.characteristicUUID);

        const bluetoothGattCharacteristic = this._findNotifyCharacteristic(bluetoothGattService, characteristicUUID);
        if (!bluetoothGattCharacteristic) {
          reject(
            'Could not find characteristic with UUID ' +
              arg.characteristicUUID +
              ' on service with UUID ' +
              arg.serviceUUID +
              ' on peripheral with UUID ' +
              arg.peripheralUUID
          );
          return;
        }

        if (!gatt.setCharacteristicNotification(bluetoothGattCharacteristic, true)) {
          reject('Failed to register notification for characteristic ' + arg.characteristicUUID);
          return;
        }

        const clientCharacteristicConfigId = this.stringToUuid('2902');
        let bluetoothGattDescriptor = bluetoothGattCharacteristic.getDescriptor(clientCharacteristicConfigId);
        if (!bluetoothGattDescriptor) {
          bluetoothGattDescriptor = new android.bluetooth.BluetoothGattDescriptor(
            clientCharacteristicConfigId,
            android.bluetooth.BluetoothGattDescriptor.PERMISSION_WRITE
          );
          bluetoothGattCharacteristic.addDescriptor(bluetoothGattDescriptor);
          CLog(CLogTypes.info, 'BluetoothGattDescriptor created...');
          //Any creation error will trigger the global catch. Ok.
        }

        // prefer notify over indicate
        if (
          (bluetoothGattCharacteristic.getProperties() &
            android.bluetooth.BluetoothGattCharacteristic.PROPERTY_NOTIFY) !==
          0
        ) {
          bluetoothGattDescriptor.setValue(android.bluetooth.BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
        } else if (
          (bluetoothGattCharacteristic.getProperties() &
            android.bluetooth.BluetoothGattCharacteristic.PROPERTY_INDICATE) !==
          0
        ) {
          bluetoothGattDescriptor.setValue(android.bluetooth.BluetoothGattDescriptor.ENABLE_INDICATION_VALUE);
        } else {
          reject('Characteristic ' + characteristicUUID + ' does not have NOTIFY or INDICATE property set');
          return;
        }

        if (gatt.writeDescriptor(bluetoothGattDescriptor)) {
          const cb =
            arg.onNotify ||
            function(result) {
              CLog(CLogTypes.warning, "No 'onNotify' callback function specified for 'startNotifying'");
            };
          const stateObject = this.connections[arg.peripheralUUID];
          stateObject.onNotifyCallback = cb;
          CLog(CLogTypes.info, '--- notifying');
          resolve();
        } else {
          reject('Failed to set client characteristic notification for ' + characteristicUUID);
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.startNotifying: ${ex}`);
        reject(ex);
      }
    });
  }

  // TODO lot of reuse between this and .startNotifying
  public stopNotifying(arg: StopNotifyingOptions) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(arg, reject);
        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const gatt = wrapper.gatt;
        const bluetoothGattService = wrapper.bluetoothGattService;
        const characteristicUUID = this.stringToUuid(arg.characteristicUUID);

        const bluetoothGattCharacteristic = this._findNotifyCharacteristic(bluetoothGattService, characteristicUUID);
        CLog(CLogTypes.info, '---- got gatt service characteristic ----', bluetoothGattCharacteristic);

        if (!bluetoothGattCharacteristic) {
          reject(
            `Could not find characteristic with UUID ${arg.characteristicUUID} on service with UUID ${
              arg.serviceUUID
            } on peripheral with UUID ${arg.peripheralUUID}`
          );
          return;
        }

        const stateObject = this.connections[arg.peripheralUUID];
        stateObject.onNotifyCallback = null;

        if (gatt.setCharacteristicNotification(bluetoothGattCharacteristic, false)) {
          resolve();
        } else {
          reject('Failed to remove client characteristic notification for ' + characteristicUUID);
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.stopNotifying: ${ex}`);
        reject(ex);
      }
    });
  }

  /* * * * * *  BLUETOOTH PERIPHERAL CODE * * * * * * */
  public getAdapter() {
    return this.adapter;
  }

  public removeBond(device) {
    try {
      let m = device.getClass();
      const tmp = Array.create('java.lang.Class', 0);
      m = m.getMethod('removeBond', tmp);
      const removed = m.invoke(device, null);
      CLog(CLogTypes.info, 'Removed bond');
      return removed;
    } catch (ex) {
      CLog(CLogTypes.error, `Bluetooth.removeBond ${ex}`);
    }
  }

  /**
   * Perform a service discovery on the remote device to get the UUIDs supported.
   */
  public fetchUuidsWithSdp(device) {
    try {
      let m = device.getClass();
      const tmp = Array.create('java.lang.Class', 0);
      m = m.getMethod('fetchUuidsWithSdp', tmp);
      const worked = m.invoke(device, null);
      return worked;
    } catch (ex) {
      CLog(CLogTypes.error, `Bluetooth.fetchUuidsWithSdp ${ex}`);
    }
  }

  // public setGattServerCallbacks(callbackOptions) {
  //   _onServerConnectionStateChangeCallback = null;
  //   _onBondStatusChangeCallback = null;
  //   _onDeviceNameChangeCallback = null;
  //   _onDeviceUUIDChangeCallback = null;
  //   _onDeviceACLDisconnectedCallback = null;
  //   _onCharacteristicWriteRequestCallback = null;
  //   _onCharacteristicReadRequestCallback = null;
  //   _onDescriptorWriteRequestCallback = null;
  //   _onDescriptorReadRequestCallback = null;

  //   if (callbackOptions !== null && callbackOptions !== undefined) {
  //     _onServerConnectionStateChangeCallback = callbackOptions.onServerConnectionStateChange;
  //     _onBondStatusChangeCallback = callbackOptions.onBondStatusChange;
  //     _onDeviceNameChangeCallback = callbackOptions.onDeviceNameChange;
  //     _onDeviceUUIDChangeCallback = callbackOptions.onDeviceUUIDChange;
  //     _onDeviceACLDisconnectedCallback = callbackOptions.onDeviceACLDisconnected;
  //     _onCharacteristicWriteRequestCallback = callbackOptions.onCharacteristicWrite;
  //     _onCharacteristicReadRequestCallback = callbackOptions.onCharacteristicRead;
  //     _onDescriptorWriteRequestCallback = callbackOptions.onDescriptorWrite;
  //     _onDescriptorReadRequestCallback = callbackOptions.onDescriptorRead;
  //   }
  // }

  /**
   * Close the GATT server instance.
   */
  public stopGattServer() {
    // this.setGattServerCallbacks();
    if (this.gattServer) {
      this.gattServer.close();
    }
    this.gattServer = null;
  }

  /**
   * Open a GATT Server The callback is used to deliver results to Caller, such as connection status as well as the results of any other GATT server operations.
   * The method returns a BluetoothGattServer instance. You can use BluetoothGattServer to conduct GATT server operations.
   */
  public startGattServer() {
    // peripheral mode:

    // if >= Android21 (Lollipop)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
      this.gattServer = this.bluetoothManager.openGattServer(
        utils.ad.getApplicationContext(),
        this.bluetoothGattServerCallback
      );
    }
  }

  public setDiscoverable() {
    return new Promise((resolve, reject) => {
      try {
        _onBluetoothDiscoverableResolve = resolve;
        const intent = new android.content.Intent(android.bluetooth.BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE);
        application.android.foregroundActivity.startActivityForResult(
          intent,
          ACTION_REQUEST_BLUETOOTH_DISCOVERABLE_REQUEST_CODE
        );
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.setDiscoverable: ${ex}`);
        reject(ex);
      }
    });
  }

  public getAdvertiser() {
    if (this.adapter.isMultipleAdvertisementSupported()) {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
        return this.adapter.getBluetoothLeAdvertiser();
      }
    }
  }

  public makeService(serviceOptions) {
    const suuid = this.stringToUuid(serviceOptions.UUID);
    const serviceType: number =
      serviceOptions.serviceType || android.bluetooth.BluetoothGattService.SERVICE_TYPE_PRIMARY;
    return new android.bluetooth.BluetoothGattService(suuid, serviceType);
  }

  public makeCharacteristic(characteristicOptions) {
    const cuuid = this.stringToUuid(characteristicOptions.UUID);
    const gprop = characteristicOptions.gattProperty || android.bluetooth.BluetoothGattCharacteristic.PROPERTY_READ;
    const gperm =
      characteristicOptions.gattPermissions || android.bluetooth.BluetoothGattCharacteristic.PERMISSION_READ;
    return new android.bluetooth.BluetoothGattCharacteristic(cuuid, gprop, gperm);
  }

  public makeDescriptor(options) {
    const uuid = this.stringToUuid(options.UUID);
    const perms: number = options.permissions || android.bluetooth.BluetoothGattDescriptor.PERMISSION_READ;
    return new android.bluetooth.BluetoothGattDescriptor(uuid, perms);
  }

  public addService(service) {
    if (service && this.gattServer) {
      this.gattServer.addService(service);
    }
  }

  public getServerService(uuidString) {
    if (this.gattServer) {
      const pUuid = this.stringToUuid(uuidString);
      const services = this.gattServer.getServices();
      /*
	CLog(services);
	CLog(services.length);
	CLog(services.size());
	for (let i=0; i<services.size(); i++) {
	    CLog(services.get(i));
	    CLog(services.get(i).getUuid());
	}
	*/
      const s = this.gattServer.getService(pUuid);
      CLog(CLogTypes.info, `---- gattServer.getService: ${s} - ${s && s.getUuid()}`);
      return s;
    }
    return null;
  }

  public offersService(uuidString) {
    return this.getServerService(uuidString) !== null;
  }

  public clearServices() {
    if (this.gattServer) {
      this.gattServer.clearServices();
    }
  }

  public cancelServerConnection(device) {
    if (this.gattServer && device) {
      CLog(CLogTypes.info, '----- cancelServerConnection -> gattServer.cancelConnection', device);
      this.gattServer.cancelConnection(device);
    }
  }

  /**
   * Get connected devices for this specific profile.
   * Return the set of devices which are in state STATE_CONNECTED
   * Requires the BLUETOOTH permission.
   * @returns - List of Bluetooth devices. The list will be empty on error.
   */
  public getServerConnectedDevices() {
    if (this.gattServer && this.bluetoothManager) {
      return this.bluetoothManager.getConnectedDevices(android.bluetooth.BluetoothProfile.GATT);
    }
  }

  /**
   * Get the current connection state of the profile.
   * @param device [android.bluetooth.BluetoothDevice] - Remote bluetooth device.
   */
  public getServerConnectedDeviceState(device: android.bluetooth.BluetoothDevice) {
    if (this.gattServer && device && this.bluetoothManager) {
      return this.bluetoothManager.getConnectionState(device, android.bluetooth.BluetoothProfile.GATT);
    }
  }

  /**
   * Get a list of devices that match any of the given connection states.
   * @param states - Array of states. States can be one of:
   * android.bluetooth.BluetoothProfile.STATE_CONNECTED,
   * android.bluetooth.BluetoothProfile.STATE_CONNECTING,
   * android.bluetooth.BluetoothProfile.STATE_DISCONNECTED,
   * android.bluetooth.BluetoothProfile.STATE_DISCONNECTING,
   * @link - https://developer.android.com/reference/android/bluetooth/BluetoothManager.html#getDevicesMatchingConnectionStates(int,%20int[])
   */
  public getServerConnectedDevicesMatchingState(states) {
    if (this.gattServer && this.bluetoothManager && states) {
      return this.bluetoothManager.getDevicesMatchingConnectionStates(android.bluetooth.BluetoothProfile.GATT, [
        states
      ]);
    }
  }

  public startAdvertising(opts: StartAdvertisingOptions) {
    return new Promise((resolve, reject) => {
      if (!this.adapter) {
        // TODO: should we create a new adapter here by default and not reject???
        reject('Bluetooth not properly initialized!');
        return;
      }

      const adv = this.getAdvertiser();
      CLog(CLogTypes.info, `advertiser: ${adv}`);

      if (adv === null || !this.adapter.isMultipleAdvertisementSupported()) {
        reject('Adapter is turned off or doesnt support bluetooth advertisement');
        return;
      } else {
        const settings = opts.settings;
        const _s = new android.bluetooth.le.AdvertiseSettings.Builder()
          .setAdvertiseMode(settings.advertiseMode || android.bluetooth.le.AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
          .setTxPowerLevel(settings.txPowerLevel || android.bluetooth.le.AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
          .setConnectable(settings.connectable || false)
          .build();

        const pUuid = android.os.ParcelUuid.fromString(opts.UUID) as android.os.ParcelUuid;

        const data = opts.data;
        const _d = new android.bluetooth.le.AdvertiseData.Builder().addServiceUuid(pUuid).build();

        const _scanResult = new android.bluetooth.le.AdvertiseData.Builder()
          .setIncludeDeviceName(data.includeDeviceName || true)
          .build();

        CLog(CLogTypes.info, '---- bluetooth starting advertising ----');

        adv.startAdvertising(_s, _d, _scanResult, this.advertiseCallback);
        resolve();
      }
    });
  }

  public stopAdvertising() {
    return new Promise((resolve, reject) => {
      if (this.adapter === null || this.adapter === undefined) {
        reject('Bluetooth not properly initialized!');
        return;
      }

      const adv = this.getAdvertiser();
      CLog(CLogTypes.info, `advertiser: ${adv}`);

      if (adv === null || !this.adapter.isMultipleAdvertisementSupported()) {
        reject('Adapter is turned off or doesnt support bluetooth advertisement');
        return;
      } else {
        CLog(CLogTypes.info, '----- bluetooth stopping advertising!');
        adv.stopAdvertising(this.advertiseCallback);
        resolve();
      }
    });
  }

  public disable() {
    this.adapter.disable();
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  public isPeripheralModeSupported() {
    return new Promise((resolve, reject) => {
      resolve(
        this.adapter.isMultipleAdvertisementSupported() &&
          this.adapter.isOffloadedFilteringSupported() &&
          this.adapter.isOffloadedScanBatchingSupported()
      );
    });
  }
  /* * * * * * END BLUETOOTH PERIPHERAL CODE  * * * * */

  public gattDisconnect(gatt: android.bluetooth.BluetoothGatt) {
    if (gatt !== null) {
      const device = gatt.getDevice() as android.bluetooth.BluetoothDevice;
      const stateObject = this.connections[device.getAddress()];
      CLog(CLogTypes.info, '---- invoking disconnect callback ----');
      if (stateObject && stateObject.onDisconnected) {
        stateObject.onDisconnected({
          UUID: device.getAddress(),
          name: device.getName()
        });
      } else {
        CLog(CLogTypes.info, '---- no disconnect callback found');
      }
      this.connections[device.getAddress()] = null;
      // Close this Bluetooth GATT client.
      CLog(CLogTypes.info, 'Closing GATT client');
      gatt.close();
    }
  }

  // Java UUID -> JS
  public uuidToString(uuid) {
    const uuidStr = uuid.toString();
    const pattern = java.util.regex.Pattern.compile('0000(.{4})-0000-1000-8000-00805f9b34fb', 2);
    const matcher = pattern.matcher(uuidStr);
    return matcher.matches() ? matcher.group(1) : uuidStr;
  }

  // val must be a Uint8Array or Uint16Array or a string like '0x01' or '0x007F' or '0x01,0x02', or '0x007F,'0x006F''
  public encodeValue(val) {
    let parts = val;
    // if it's not a string assume it's a byte array already
    if (typeof val === 'string') {
      parts = val.split(',');

      if (parts[0].indexOf('x') === -1) {
        return null;
      }
    }

    const result = Array.create('byte', parts.length);

    for (let i = 0; i < parts.length; i++) {
      result[i] = parts[i];
    }
    return result;
  }

  public decodeValue(value) {
    if (value === null) {
      return null;
    }

    // value is of Java type: byte[]
    const b = android.util.Base64.encodeToString(value, android.util.Base64.NO_WRAP);
    return this.base64ToArrayBuffer(b);
  }

  // JS UUID -> Java
  public stringToUuid(uuidStr) {
    if (uuidStr.length === 4) {
      uuidStr = '0000' + uuidStr + '-0000-1000-8000-00805f9b34fb';
    }
    return java.util.UUID.fromString(uuidStr);
  }

  public extractManufacturerRawData(scanRecord) {
    let offset = 0;
    while (offset < scanRecord.length - 2) {
      const len = scanRecord[offset++] & 0xff;
      if (len === 0) {
        break;
      }

      const type = scanRecord[offset++] & 0xff;
      switch (type) {
        case 0xff: // Manufacturer Specific Data
          return this.decodeValue(java.util.Arrays.copyOfRange(scanRecord, offset, offset + len - 1));
        default:
          offset += len - 1;
          break;
      }
    }
  }

  // This guards against peripherals reusing char UUID's. We prefer notify.
  private _findNotifyCharacteristic(bluetoothGattService, characteristicUUID) {
    // Check for Notify first
    const characteristics = bluetoothGattService.getCharacteristics();
    for (let i = 0; i < characteristics.size(); i++) {
      const c = characteristics.get(i);
      if (
        (c.getProperties() & android.bluetooth.BluetoothGattCharacteristic.PROPERTY_NOTIFY) !== 0 &&
        characteristicUUID.equals(c.getUuid())
      ) {
        return c;
      }
    }

    // If there wasn't a Notify Characteristic, check for Indicate
    for (let j = 0; j < characteristics.size(); j++) {
      const ch = characteristics.get(j);
      if (
        (ch.getProperties() & android.bluetooth.BluetoothGattCharacteristic.PROPERTY_INDICATE) !== 0 &&
        characteristicUUID.equals(ch.getUuid())
      ) {
        return ch;
      }
    }

    // As a last resort, try and find ANY characteristic with this UUID, even if it doesn't have the correct properties
    return bluetoothGattService.getCharacteristic(characteristicUUID);
  }

  // This guards against peripherals reusing char UUID's.
  private _findCharacteristicOfType(
    bluetoothGattService: android.bluetooth.BluetoothGattService,
    characteristicUUID,
    charType
  ) {
    // Returns a list of characteristics included in this service.
    const characteristics = bluetoothGattService.getCharacteristics();
    for (let i = 0; i < characteristics.size(); i++) {
      const c = characteristics.get(i) as android.bluetooth.BluetoothGattCharacteristic;
      if ((c.getProperties() & charType) !== 0 && characteristicUUID.equals(c.getUuid())) {
        return c;
      }
    }
    // As a last resort, try and find ANY characteristic with this UUID, even if it doesn't have the correct properties
    return bluetoothGattService.getCharacteristic(characteristicUUID);
  }

  private _getWrapper(arg, reject) {
    if (!this._isEnabled()) {
      reject('Bluetooth is not enabled');
      return;
    }
    if (!arg.peripheralUUID) {
      reject('No peripheralUUID was passed');
      return;
    }
    if (!arg.serviceUUID) {
      reject('No serviceUUID was passed');
      return;
    }
    if (!arg.characteristicUUID) {
      reject('No characteristicUUID was passed');
      return;
    }

    const serviceUUID = this.stringToUuid(arg.serviceUUID);

    const stateObject = this.connections[arg.peripheralUUID];
    if (!stateObject) {
      reject('The peripheral is disconnected');
      return;
    }

    const gatt = stateObject.device;
    const bluetoothGattService = gatt.getService(serviceUUID);

    if (!bluetoothGattService) {
      reject('Could not find service with UUID ' + arg.serviceUUID + ' on peripheral with UUID ' + arg.peripheralUUID);
      return;
    }

    // with that all being checked, let's return a wrapper object containing all the stuff we found here
    return {
      gatt: gatt,
      bluetoothGattService: bluetoothGattService
    };
  }

  private _isEnabled() {
    return this.adapter !== null && this.adapter.isEnabled();
  }
}

(function() {
  // TODO add something similar for permissions: https://github.com/EddyVerbruggen/nativescript-barcodescanner/blob/master/barcodescanner.android.ts#L20
  // application.android.on(
  //   application.AndroidApplication.activityResultEvent,
  //   (data: application.AndroidActivityResultEventData) => {
  //     if (data.requestCode === ACTION_REQUEST_ENABLE_BLUETOOTH_REQUEST_CODE) {
  //       this._onBluetoothEnabledResolve(data.resultCode === -1);
  //       _onBluetoothEnabledResolve = undefined;
  //     } else if (data.requestCode === ACTION_REQUEST_BLUETOOTH_DISCOVERABLE_REQUEST_CODE) {
  //       this._onBluetoothDiscoverableResolve(data.resultCode === -1);
  //       _onBluetoothDiscoverableResolve = undefined;
  //     }
  //   }
  // );
})();
