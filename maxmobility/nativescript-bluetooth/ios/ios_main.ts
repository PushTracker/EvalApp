/// <reference path="../node_modules/tns-platform-declarations/ios.d.ts" />

declare var NSMakeRange;

import { ios as iOS_Utils } from 'tns-core-modules/utils/utils';
import {
  BluetoothCommon,
  CLog,
  StopNotifyingOptions,
  StartNotifyingOptions,
  ConnectOptions,
  StartScanningOptions,
  StartAdvertisingOptions,
  CLogTypes
} from '../common';
import { CBPeripheralManagerDelegateImpl } from './CBPeripheralManagerDelegateImpl';
import { CBPeripheralDelegateImpl } from './CBPeripheralDelegateImpl';
import { CBCentralManagerDelegateImpl } from './CBCentralManagerDelegateImpl';

export class Bluetooth extends BluetoothCommon {
  private _centralDelegate = CBCentralManagerDelegateImpl.new().initWithCallback(new WeakRef(this), obj => {
    CLog(CLogTypes.info, `---- centralDelegate ---- obj: ${obj}`);
  });
  private _centralPeripheralMgrDelegate = CBPeripheralManagerDelegateImpl.new().init();
  private _centralManager = CBCentralManager.alloc().initWithDelegateQueue(this._centralDelegate, null);
  public _peripheralManager = CBPeripheralManager.new().initWithDelegateQueue(this._centralPeripheralMgrDelegate, null);

  private _data_service: CBMutableService;
  public _peripheralArray = null;
  public _connectCallbacks = {};
  public _disconnectCallbacks = {};
  public _onDiscovered = null;

  constructor() {
    super();
    CLog(CLogTypes.info, '*** iOS Bluetooth Constructor ***');
    CLog(CLogTypes.info, `this._centralManager: ${this._centralManager}`);
    CLog(CLogTypes.info, `this._peripheralManager: ${this._peripheralManager}`);
  }

  public _getState(state: CBPeripheralState) {
    if (state === CBPeripheralState.Connecting) {
      return 'connecting';
    } else if (state === CBPeripheralState.Connected) {
      return 'connected';
    } else if (state === CBPeripheralState.Disconnected) {
      return 'disconnected';
    } else {
      CLog(
        CLogTypes.warning,
        `Bluetooth._getState ---- Unexpected state, returning 'disconnected' for state of ${state}`
      );
      return 'disconnected';
    }
  }

  public isBluetoothEnabled() {
    return new Promise((resolve, reject) => {
      try {
        const isEnabled = this._isEnabled();
        resolve(isEnabled);
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.isBluetoothEnabled ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public startScanning(arg: StartScanningOptions) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._isEnabled()) {
          CLog(CLogTypes.info, `Bluetooth.startScanning ---- Bluetooth is not enabled.`);
          reject('Bluetooth is not enabled.');
          return;
        }

        this._peripheralArray = NSMutableArray.new();
        this._onDiscovered = arg.onDiscovered;
        const serviceUUIDs = arg.serviceUUIDs || [];

        // let services: NSArray<CBUUID>;
        const services = [];
        for (const s in serviceUUIDs) {
          if (s) {
            services.push(CBUUID.UUIDWithString(serviceUUIDs[s]));
          }
        }

        // TODO: check on the services as any casting
        this._centralManager.scanForPeripheralsWithServicesOptions(services as any, null);
        if (arg.seconds) {
          setTimeout(() => {
            // note that by now a manual 'stop' may have been invoked, but that doesn't hurt
            this._centralManager.stopScan();
            resolve();
          }, arg.seconds * 1000);
        } else {
          resolve();
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.startScanning ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public toArrayBuffer(value) {
    if (value === null) {
      return null;
    }

    // value is of ObjC type: NSData
    const b = value.base64EncodedStringWithOptions(0);
    return this.base64ToArrayBuffer(b);
  }

  public removeBond(device) {
    /*
    try {
  let m = device.getClass();
  const tmp = Array.create("java.lang.Class", 0);
  m = m.getMethod("removeBond", tmp);
  const removed = m.invoke(device, null);

  return removed;
    }
    catch (ex) {
  CLog(ex);
    }
    */
  }

  public fetchUuidsWithSdp(device) {
    /*
    try {
  let m = device.getClass();
  const tmp = Array.create("java.lang.Class", 0);
  m = m.getMethod("fetchUuidsWithSdp", tmp);
  const worked = m.invoke(device, null);

  return worked;
    }
    catch (ex) {
  CLog(ex);
    }
    */
  }

  public setGattServerCallbacks(callbackOptions) {
    // _onServerConnectionStateChangeCallback = null;
    // _onBondStatusChangeCallback = null;
    // _onDeviceNameChangeCallback = null;
    // _onDeviceUUIDChangeCallback = null;
    // _onDeviceACLDisconnectedCallback = null;
    // _onCharacteristicWriteRequestCallback = null;
    // _onCharacteristicReadRequestCallback = null;
    // _onDescriptorWriteRequestCallback = null;
    // _onDescriptorReadRequestCallback = null;
    // if (callbackOptions !== null && callbackOptions !== undefined) {
    //   _onServerConnectionStateChangeCallback = callbackOptions.onServerConnectionStateChange;
    //   _onBondStatusChangeCallback = callbackOptions.onBondStatusChange;
    //   _onDeviceNameChangeCallback = callbackOptions.onDeviceNameChange;
    //   _onDeviceUUIDChangeCallback = callbackOptions.onDeviceUUIDChange;
    //   _onDeviceACLDisconnectedCallback = callbackOptions.onDeviceACLDisconnected;
    //   _onCharacteristicWriteRequestCallback = callbackOptions.onCharacteristicWrite;
    //   _onCharacteristicReadRequestCallback = callbackOptions.onCharacteristicRead;
    //   _onDescriptorWriteRequestCallback = callbackOptions.onDescriptorWrite;
    //   _onDescriptorReadRequestCallback = callbackOptions.onDescriptorRead;
    // }
  }

  public stopGattServer() {
    // this.setGattServerCallbacks();
    // if (gattServer !== null && gattServer !== undefined) {
    //   gattServer.close();
    // }
    // gattServer = null;
  }

  public startGattServer() {
    /*
    // peripheral mode:
    if (android.os.Build.VERSION.SDK_INT >= 21) { android.os.Build.VERSION_CODES.LOLLIPOP
  gattServer = bluetoothManager.openGattServer(utils.ad.getApplicationContext(), Bluetooth._MyGattServerCallback);
  Bluetooth._gattServer = gattServer;
    }
    */
  }

  public setDiscoverable() {
    return new Promise((resolve, reject) => {
      /*
  try {
      _onBluetoothDiscoverableResolve = resolve;
      var intent = new android.content.Intent(android.bluetooth.BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE);
      application.android.foregroundActivity.startActivityForResult(intent, ACTION_REQUEST_BLUETOOTH_DISCOVERABLE_REQUEST_CODE);
  } catch (ex) {
      CLog("Error in Bluetooth.setDiscoverable: " + ex);
      reject(ex);
  }
  */
      resolve();
    });
  }

  public getAdvertiser() {
    // return adapter.getBluetoothAdvertiser();
    return null;
  }

  public makeService(serviceOptions) {
    /*
    let suuid = Bluetooth._stringToUuid(serviceOptions.UUID);
    let serviceType = new Number(serviceOptions.serviceType || android.bluetooth.BluetoothGattService.SERVICE_TYPE_PRIMARY);

    return new android.bluetooth.BluetoothGattService( suuid, serviceType );
    */
    return null;
  }

  public makeCharacteristic(characteristicOptions) {
    /*
    let cuuid = Bluetooth._stringToUuid(characteristicOptions.UUID);
    let gprop = new Number(characteristicOptions.gattProperty || android.bluetooth.BluetoothGattCharacteristic.PROPERTY_READ);
    let gperm = new Number(characteristicOptions.gattPermissions || android.bluetooth.BluetoothGattCharacteristic.PERMISSION_READ);

    return new android.bluetooth.BluetoothGattCharacteristic(cuuid, gprop, gperm);
    */
    return null;
  }

  public makeDescriptor(options) {
    const uuid = this._stringToUuid(options.UUID);
    // return new android.bluetooth.BluetoothGattDescriptor(uuid, perms);
    return null;
  }

  public addService(service) {
    // if (service !== null && service !== undefined && gattServer !== null && gattServer !== undefined) {
    //   gattServer.addService(service);
    // }
  }

  public getServerService(uuidString) {
    //     if (gattServer !== null && gattServer !== undefined) {
    //       const pUuid = this._stringToUuid(uuidString);
    //       const services = gattServer.getServices();
    //       /*
    //   CLog(services);
    //   CLog(services.length);
    //   CLog(services.size());
    //   for (let i=0; i<services.size(); i++) {
    //       CLog(services.get(i));
    //       CLog(services.get(i).getUuid());
    //   }
    //   */
    //       const s = gattServer.getService(pUuid);
    //       CLog(`---- gattServer.getService: ${s} - ${s && s.getUuid()}`);
    //       return s;
    //     }
    //     return null;
  }

  public offersService(uuidString) {
    return this.getServerService(uuidString) !== null;
  }

  public clearServices() {
    // if (gattServer !== null && gattServer !== undefined) {
    //   // gattServer.clearServices();
    // }
  }

  public cancelServerConnection(device) {
    // if (gattServer !== null && gattServer !== undefined && device !== null && device !== undefined) {
    //   // gattServer.cancelConnection(device);
    // }
  }

  public getServerConnectedDevices() {
    // if (
    //   gattServer !== null &&
    //   gattServer !== undefined &&
    //   bluetoothManager !== null &&
    //   bluetoothManager !== undefined
    // ) {
    //   // return bluetoothManager.getConnectedDevices(android.bluetooth.BluetoothGattServer.GATT);
    //   return null;
    // }
  }

  public getServerConnectedDeviceState(device) {
    // if (
    //   gattServer !== null &&
    //   gattServer !== undefined &&
    //   device !== null &&
    //   device !== undefined &&
    //   bluetoothManager !== null &&
    //   bluetoothManager !== undefined
    // ) {
    //   // return bluetoothManager.getConnectionState(device, android.bluetooth.BluetoothGattServer.GATT);
    //   return null;
    // }
  }

  public getServerConnectedDevicesMatchingState(state) {
    // if (
    //   gattServer !== null &&
    //   gattServer !== undefined &&
    //   state !== null &&
    //   state !== undefined &&
    //   bluetoothManager !== null &&
    //   bluetoothManager !== undefined
    // ) {
    //   // return bluetoothManager.getDevicesMatchingConnectionState(android.bluetooth.BluetoothGattServer.GATT, state);
    //   return null;
    // }
  }

  public startAdvertising(args: StartAdvertisingOptions) {
    return new Promise((resolve, reject) => {
      try {
        const uuid = CBUUID.UUIDWithString(args.UUID);

        CLog(CLogTypes.info, `Bluetooth.startAdvertising ---- creating advertisement`);
        const advertisement = NSDictionary.dictionaryWithObjectsForKeys(
          [[uuid], 'data_service'],
          [CBAdvertisementDataServiceUUIDsKey, CBAdvertisementDataLocalNameKey]
        );

        this._peripheralManager.startAdvertising(advertisement);

        CLog(CLogTypes.info, `Bluetooth.startAdvertising ---- bluetooth is advertising`);
        resolve();
      } catch (error) {
        CLog(CLogTypes.error, `Bluetooth.startAdvertising ---- ${error}`);
        reject(error);
      }

      resolve();
      /*
  if (adapter === null || adapter === undefined) {
      reject("Bluetooth not properly initialized!");

      return;
  }
  let adv = adapter.getBluetoothLeAdvertiser();
  if (adv === null || !adapter.isMultipleAdvertisementSupported()) {
      reject("Adapter is turned off or doesnt support bluetooth advertisement");
      return;
  }
  else {
      let settings = advertiseOptions.settings;
      let _s = new android.bluetooth.le.AdvertiseSettings.Builder()
    .setAdvertiseMode( settings.advertiseMode || android.bluetooth.le.AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY )
    .setTxPowerLevel( settings.txPowerLevel || android.bluetooth.le.AdvertiseSettings.ADVERTISE_TX_POWER_HIGH )
    .setConnectable( settings.connectable || false )
    .build();

      let pUuid = new android.os.ParcelUuid.fromString( advertiseOptions.UUID );

      let data = advertiseOptions.data;
      let _d = new android.bluetooth.le.AdvertiseData.Builder()
    .addServiceUuid( pUuid )
    .build();

      let _scanResult = new android.bluetooth.le.AdvertiseData.Builder()
    .setIncludeDeviceName( data.includeDeviceName || true )
    .build();

      CLog("--- bluetooth starting advertising!");
      _onBluetoothAdvertiseResolve = resolve;
      _onBluetoothAdvertiseReject = reject;
      //adv.startAdvertising(_s, _d, Bluetooth._MyAdvertiseCallback);
      adv.startAdvertising(_s, _d, _scanResult, Bluetooth._MyAdvertiseCallback);
  }
  */
    });
  }

  public stopAdvertising() {
    return new Promise((resolve, reject) => {
      /*
  if (adapter === null || adapter === undefined) {
      reject("Bluetooth not properly initialized!");

      return;
  }
  let adv = adapter.getBluetoothLeAdvertiser();
  if (adv === null || !adapter.isMultipleAdvertisementSupported()) {
      reject("Adapter is turned off or doesnt support bluetooth advertisement");

      return;
  }
  else {
      CLog("--- bluetooth stopping advertising!");
      _onBluetoothAdvertiseResolve = resolve;
      _onBluetoothAdvertiseReject = reject;
      adv.stopAdvertising(Bluetooth._MyAdvertiseCallback);
      resolve(); // for some reason the callback doesn't get called... TODO: FIX
  }
  */
      resolve();
    });
  }

  public disable() {
    /*
    adapter.disable();
    */
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  public isPeripheralModeSupported() {
    return new Promise((resolve, reject) => {
      try {
        const newPM = CBPeripheralManager.new().initWithDelegateQueue(null, null);
        CLog(CLogTypes.info, `Bluetooth.isPeripheralModeSupported ---- new CBPeripheralManager ${newPM}`);
        if (!newPM) {
          reject(false);
        } else {
          resolve(true);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  /* * * * * * END BLUETOOTH PERIPHERAL CODE  * * * * */

  public enable() {
    return new Promise((resolve, reject) => {
      CLog(CLogTypes.info, 'Bluetooth.enable ---- Not possible on iOS');
      reject('Not possible - you may want to choose to not call this function on iOS.');
    });
  }

  public stopScanning(arg) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._isEnabled()) {
          reject('Bluetooth is not enabled.');
          return;
        }
        this._centralManager.stopScan();
        resolve();
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.stopScanning ---- ${ex}`);
        reject(ex);
      }
    });
  }

  // note that this doesn't make much sense without scanning first
  public connect(args: ConnectOptions) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._isEnabled()) {
          reject('Bluetooth is not enabled.');
          return;
        }
        if (!args.UUID) {
          reject('No UUID was passed');
          return;
        }
        CLog(CLogTypes.info, `Bluetooth.connect ---- ${args.UUID}`);
        const peripheral = this.findPeripheral(args.UUID);
        CLog(CLogTypes.info, `Bluetooth.connect ---- peripheral found: ${peripheral}`);

        if (!peripheral) {
          reject(`Could not find peripheral with UUID: ${args.UUID}`);
        } else {
          CLog(CLogTypes.info, `Bluetooth.connect ---- Connecting to peripheral with UUID: ${args.UUID}`);
          this._connectCallbacks[args.UUID] = args.onConnected;
          this._disconnectCallbacks[args.UUID] = args.onDisconnected;
          this._centralManager.connectPeripheralOptions(peripheral, null);
          resolve();
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.connect ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public disconnect(arg) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._isEnabled()) {
          reject('Bluetooth is not enabled');
          return;
        }
        if (!arg.UUID) {
          reject('No UUID was passed');
          return;
        }
        const peripheral = this.findPeripheral(arg.UUID);
        if (!peripheral) {
          reject('Could not find peripheral with UUID ' + arg.UUID);
        } else {
          CLog(CLogTypes.info, 'Bluetooth.disconnect ---- Disconnecting peripheral with UUID: ' + arg.UUID);
          // no need to send an error when already disconnected, but it's wise to check it
          if (peripheral.state !== CBPeripheralState.Disconnected) {
            this._centralManager.cancelPeripheralConnection(peripheral);
            peripheral.delegate = null;
            // TODO remove from the peripheralArray as well
          }
          resolve();
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.disconnect ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public isConnected(arg) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._isEnabled()) {
          reject('Bluetooth is not enabled');
          return;
        }
        if (!arg.UUID) {
          reject('No UUID was passed');
          return;
        }
        const peripheral = this.findPeripheral(arg.UUID);
        if (peripheral === null) {
          reject('Could not find peripheral with UUID ' + arg.UUID);
        } else {
          CLog(CLogTypes.info, 'Bluetooth.isConnected ---- checking connection with peripheral UUID: ' + arg.UUID);
          resolve(peripheral.state === CBPeripheralState.Connected);
        }
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.isConnected ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public findPeripheral(UUID): CBPeripheral {
    for (let i = 0; i < this._peripheralArray.count; i++) {
      const peripheral = this._peripheralArray.objectAtIndex(i);
      if (UUID === peripheral.identifier.UUIDString) {
        return peripheral;
      }
    }
    return null;
  }

  public read(arg) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(arg, CBCharacteristicProperties.PropertyRead, reject);
        if (wrapper === null) {
          // no need to reject, this has already been done in _getWrapper()
          return;
        }

        // TODO we could (should?) make this characteristic-specific
        (wrapper.peripheral.delegate as CBPeripheralDelegateImpl)._onReadPromise = resolve;
        wrapper.peripheral.readValueForCharacteristic(wrapper.characteristic);
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.read ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public write(arg) {
    return new Promise((resolve, reject) => {
      try {
        if (!arg.value) {
          reject(`You need to provide some data to write in the 'value' property.`);
          return;
        }
        const wrapper = this._getWrapper(arg, CBCharacteristicProperties.PropertyWrite, reject);
        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const valueEncoded = this._encodeValue(arg.value);
        if (valueEncoded === null) {
          reject('Invalid value: ' + arg.value);
          return;
        }

        // the promise will be resolved from 'didWriteValueForCharacteristic',
        // but we should make this characteristic-specific (see .read)
        (wrapper.peripheral.delegate as CBPeripheralDelegateImpl)._onWritePromise = resolve;

        wrapper.peripheral.writeValueForCharacteristicType(
          valueEncoded,
          wrapper.characteristic,
          // CBCharacteristicWriteWithResponse
          CBCharacteristicWriteType.WithResponse
        );
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.write ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public writeWithoutResponse(arg) {
    return new Promise((resolve, reject) => {
      try {
        if (!arg.value) {
          reject("You need to provide some data to write in the 'value' property");
          return;
        }
        // const wrapper = this._getWrapper(arg, CBCharacteristicPropertyWriteWithoutResponse, reject);
        const wrapper = this._getWrapper(arg, CBCharacteristicProperties.PropertyWriteWithoutResponse, reject);
        if (!wrapper) {
          // no need to reject, this has already been done
          return;
        }

        const valueEncoded = this._encodeValue(arg.value);

        CLog(CLogTypes.info, 'Bluetooth.writeWithoutResponse ---- Attempting to write (encoded): ' + valueEncoded);

        wrapper.peripheral.writeValueForCharacteristicType(
          valueEncoded,
          wrapper.characteristic,
          // CBCharacteristicWriteWithoutResponse
          CBCharacteristicWriteType.WithoutResponse
        );

        resolve();
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.writeWithoutResponse ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public startNotifying(args: StartNotifyingOptions) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(args, CBCharacteristicProperties.PropertyNotify, reject);
        CLog(CLogTypes.info, `Bluetooth.startNotifying ---- wrapper: ${wrapper}`);

        if (!wrapper) {
          // no need to reject, this has already been done in _getWrapper
          return;
        }

        const cb =
          args.onNotify ||
          function(result) {
            CLog(
              CLogTypes.info,
              `Bluetooth.startNotifying ---- No 'onNotify' callback function specified for 'startNotifying()'`
            );
          };

        // TODO we could (should?) make this characteristic-specific
        (wrapper.peripheral.delegate as CBPeripheralDelegateImpl)._onNotifyCallback = cb;
        wrapper.peripheral.setNotifyValueForCharacteristic(true, wrapper.characteristic);
        resolve();
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.startNotifying ---- ${ex}`);
        reject(ex);
      }
    });
  }

  public stopNotifying(args: StopNotifyingOptions) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(args, CBCharacteristicProperties.PropertyNotify, reject);
        CLog(CLogTypes.info, `Bluetooth.stopNotifying ---- wrapper: ${wrapper}`);

        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const peripheral = this.findPeripheral(args.peripheralUUID);
        // peripheral.delegate = null;
        peripheral.setNotifyValueForCharacteristic(false, wrapper.characteristic);
        resolve();
      } catch (ex) {
        CLog(CLogTypes.error, `Bluetooth.stopNotifying ---- ${ex}`);
        reject(ex);
      }
    });
  }

  private _isEnabled() {
    const state = this._centralManager.state;
    CLog(CLogTypes.info, `Bluetooth._isEnabled ---- this._centralManager.state: ${this._centralManager.state}`);
    return state === CBManagerState.PoweredOn;
  }

  private _stringToUuid(uuidStr) {
    if (uuidStr.length === 4) {
      uuidStr = `0000${uuidStr}-0000-1000-8000-00805f9b34fb`;
    }
    return CFUUIDCreateFromString(null, uuidStr);
  }

  private _findService(UUID, peripheral) {
    for (let i = 0; i < peripheral.services.count; i++) {
      const service = peripheral.services.objectAtIndex(i);
      // CLog("--- service.UUID: " + service.UUID);
      // TODO this may need a different compare, see Cordova plugin's findServiceFromUUID function
      if (UUID.UUIDString === service.UUID.UUIDString) {
        CLog(CLogTypes.info, `Bluetooth._findService ---- found service with UUID:  ${service.UUID}`);
        return service;
      }
    }
    // service not found on this peripheral
    return null;
  }

  private _findCharacteristic(UUID, service, property) {
    CLog(
      CLogTypes.info,
      `Bluetooth._findCharacteristic ---- UUID: ${UUID}, service: ${service}, characteristics: ${
        service.characteristics
      }`
    );
    // CLog("--- _findCharacteristic characteristics.count: " + service.characteristics.count);
    for (let i = 0; i < service.characteristics.count; i++) {
      const characteristic = service.characteristics.objectAtIndex(i);
      // CLog("--- characteristic.UUID: " + characteristic.UUID);
      if (UUID.UUIDString === characteristic.UUID.UUIDString) {
        // if (property) {
        //   if ((characteristic.properties & property) === property) {
        if (property && characteristic.properties) {
          if (property === property) {
            CLog(CLogTypes.info, `Bluetooth._findCharacteristic ---- characteristic.found: ${characteristic.UUID}`);
            return characteristic;
          }
        } else {
          return characteristic;
        }
      }
    }
    // characteristic not found on this service
    CLog(CLogTypes.warning, 'Bluetooth._findCharacteristic ---- characteristic NOT found');
    return null;
  }

  private _getWrapper(
    arg,
    property: CBCharacteristicProperties,
    reject
  ): {
    peripheral: CBPeripheral;
    service: CBService;
    characteristic: CBCharacteristic;
  } {
    if (!this._isEnabled()) {
      reject('Bluetooth is not enabled');
      return;
    }
    if (!arg.peripheralUUID) {
      reject('No peripheralUUID was passed');
      return null;
    }
    if (!arg.serviceUUID) {
      reject('No serviceUUID was passed');
      return null;
    }
    if (!arg.characteristicUUID) {
      reject('No characteristicUUID was passed');
      return null;
    }

    const peripheral = this.findPeripheral(arg.peripheralUUID);
    if (!peripheral) {
      reject('Could not find peripheral with UUID ' + arg.peripheralUUID);
      return null;
    }

    if (peripheral.state !== CBPeripheralState.Connected) {
      reject('The peripheral is disconnected');
      return null;
    }

    const serviceUUID = CBUUID.UUIDWithString(arg.serviceUUID);
    const service = this._findService(serviceUUID, peripheral);
    if (!service) {
      reject('Could not find service with UUID ' + arg.serviceUUID + ' on peripheral with UUID ' + arg.peripheralUUID);
      return null;
    }

    const characteristicUUID = CBUUID.UUIDWithString(arg.characteristicUUID);
    let characteristic = this._findCharacteristic(characteristicUUID, service, property);

    // Special handling for INDICATE. If charateristic with notify is not found, check for indicate.
    // if (property === CBCharacteristicPropertyNotify && !characteristic) {
    if (property === CBCharacteristicProperties.PropertyNotify && !characteristic) {
      characteristic = this._findCharacteristic(
        characteristicUUID,
        service,
        CBCharacteristicProperties.PropertyIndicate
      );
      // characteristic = this._findCharacteristic(characteristicUUID, service, CBCharacteristicProperties.PropertyIndicate PropertyIndicate);
    }

    // As a last resort, try and find ANY characteristic with this UUID, even if it doesn't have the correct properties
    if (!characteristic) {
      characteristic = this._findCharacteristic(characteristicUUID, service, null);
    }

    if (!characteristic) {
      reject(
        `Could not find characteristic with UUID ${arg.characteristicUUID} on service with UUID ${
          arg.serviceUUID
        } on peripheral with UUID ${arg.peripheralUUID}`
      );
      return null;
    }

    // with that all being checked, let's return a wrapper object containing all the stuff we found here
    return {
      peripheral: peripheral,
      service: service,
      characteristic: characteristic
    };
  }

  /**
   * Value must be a Uint8Array or Uint16Array or
   * a string like '0x01' or '0x007F' or '0x01,0x02', or '0x007F,'0x006F''
   */
  private _encodeValue(value) {
    // if it's not a string assume it's a UintXArray
    if (typeof value !== 'string') {
      return value.buffer;
    }
    const parts = value.split(',');
    if (parts[0].indexOf('x') === -1) {
      return null;
    }
    let result;
    if (parts[0].length === 4) {
      // eg. 0x01
      result = new Uint8Array(parts.length);
    } else {
      // assuming eg. 0x007F
      result = new Uint16Array(parts.length);
    }
    for (let i = 0; i < parts.length; i++) {
      result[i] = parts[i];
    }
    return result.buffer;
  }

  public setup_data_service(peripheral: CBPeripheralManager) {
    this._data_service.includedServices = NSArray.array();
    //  iOS_Utils.collections.jsArrayToNSArray([]);
    this._peripheralManager.removeService(this._data_service);
    this._peripheralManager.stopAdvertising();

    const data_service = CBMutableService.alloc().initWithTypePrimary(
      CBUUID.UUIDWithString(PushTrackerServiceID.data_service),
      true
    );
    CLog(CLogTypes.info, `data_service: ${data_service}`);
    this._data_service = data_service;

    // data_control characterstic
    const data_control_characteristic = CBMutableCharacteristic.alloc().initWithTypePropertiesValuePermissions(
      CBUUID.UUIDWithString(PushTrackerServiceID.data_control),
      CBCharacteristicProperties.PropertyWrite |
        CBCharacteristicProperties.PropertyRead |
        CBCharacteristicProperties.PropertyNotify,
      null,
      CBAttributePermissions.Writeable | CBAttributePermissions.Readable
    );

    // app_data characteristic
    const app_data_characteristic = CBMutableCharacteristic.alloc().initWithTypePropertiesValuePermissions(
      CBUUID.UUIDWithString(PushTrackerServiceID.app_data),
      CBCharacteristicProperties.PropertyWrite |
        CBCharacteristicProperties.PropertyRead |
        CBCharacteristicProperties.PropertyNotify,
      null,
      CBAttributePermissions.Readable | CBAttributePermissions.Writeable
    );

    // ota characteristic
    const ota_data_characteristic = CBMutableCharacteristic.alloc().initWithTypePropertiesValuePermissions(
      CBUUID.UUIDWithString(PushTrackerServiceID.ota_data),
      CBCharacteristicProperties.PropertyWrite |
        CBCharacteristicProperties.PropertyRead |
        CBCharacteristicProperties.PropertyNotify,
      null,
      CBAttributePermissions.Readable | CBAttributePermissions.Writeable
    );

    // wb_data characteristic
    const wb_data_characteristic = CBMutableCharacteristic.alloc().initWithTypePropertiesValuePermissions(
      CBUUID.UUIDWithString(PushTrackerServiceID.wb_data),
      CBCharacteristicProperties.PropertyWrite |
        CBCharacteristicProperties.PropertyRead |
        CBCharacteristicProperties.PropertyNotify,
      null,
      CBAttributePermissions.Readable | CBAttributePermissions.Writeable
    );

    // du_data characteristic
    const du_data_characteristic = CBMutableCharacteristic.alloc().initWithTypePropertiesValuePermissions(
      CBUUID.UUIDWithString(PushTrackerServiceID.du_data),
      CBCharacteristicProperties.PropertyWrite |
        CBCharacteristicProperties.PropertyRead |
        CBCharacteristicProperties.PropertyNotify,
      null,
      CBAttributePermissions.Readable | CBAttributePermissions.Writeable
    );

    // assign the characteristics
    data_service.characteristics = [data_control_characteristic, app_data_characteristic] as any;

    // add the service to the peripheral manager
    peripheral.addService(data_service);

    // let data_control_characteristic = CBMutableCharacteristic(type: PushTrackerServiceID.data_control.cb_uuid, properties: [.write, .read, .notify], value: nil, permissions: [.readable, .writeable])
    // self.data_control_characteristic = data_control_characteristic;

    // let app_data_characteristic = CBMutableCharacteristic(type: PushTrackerServiceID.app_data.cb_uuid, properties: [.write, .read, .notify], value: nil, permissions: [.readable, .writeable])
    // self.app_data_characteristic = app_data_characteristic

    // let ota_data_characteristic = CBMutableCharacteristic(type: PushTrackerServiceID.ota_data.cb_uuid, properties: [.write, .read, .notify], value: nil, permissions: [.readable, .writeable])
    // self.ota_data_characteristic = ota_data_characteristic

    // let wb_data_characteristic = CBMutableCharacteristic(type: PushTrackerServiceID.wb_data.cb_uuid, properties: [.write, .read, .notify], value: nil, permissions: [.readable, .writeable])
    // self.wb_data_characteristic = wb_data_characteristic

    // let du_data_characteristic = CBMutableCharacteristic(type: PushTrackerServiceID.du_data.cb_uuid, properties: [.write, .read, .notify], value: nil, permissions: [.readable, .writeable])
    // self.du_data_characteristic = du_data_characteristic

    // data_service.characteristics = [data_control_characteristic, app_data_characteristic, ota_data_characteristic, wb_data_characteristic, du_data_characteristic]

    // peripheral.add(data_service)
  }
}

/// MAX MOBILITY PRIVATE STUFF

const PushTrackerServiceID = {
  data_service: '9358ac8f-6343-4a31-b4e0-4b13a2b45d86',
  data_control: '58daaa15-f2b2-4cd9-b827-5807b267dae1',
  app_data: '68208ebf-f655-4a2d-98f4-20d7d860c471',
  ota_data: '9272e309-cd33-4d83-a959-b54cc7a54d1f',
  wb_data: '8489625f-6c73-4fc0-8bcc-735bb173a920',
  du_data: '5177fda8-1003-4254-aeb9-7f9edb3cc9cf'
};

const _string_uuid = (value): string => {
  switch (value) {
    case PushTrackerServiceID.data_service: //base service id
      return '9358ac8f-6343-4a31-b4e0-4b13a2b45d86';
    case PushTrackerServiceID.wb_data: //characteristic used by the band to send data to the app
      return '8489625f-6c73-4fc0-8bcc-735bb173a920';
    case PushTrackerServiceID.app_data: //characteristic used by the app to send data to the band
      return '68208ebf-f655-4a2d-98f4-20d7d860c471';
    //legacy characteristics
    case PushTrackerServiceID.data_control:
      return '58daaa15-f2b2-4cd9-b827-5807b267dae1';
    case PushTrackerServiceID.ota_data:
      return '9272e309-cd33-4d83-a959-b54cc7a54d1f';
    case PushTrackerServiceID.du_data:
      return '5177fda8-1003-4254-aeb9-7f9edb3cc9cf';
    default:
  }
};
