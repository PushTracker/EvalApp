/// <reference path="../node_modules/tns-platform-declarations/ios.d.ts" />

declare var NSMakeRange;

import { ios as iOS_Utils } from 'tns-core-modules/utils/utils';
import { BluetoothCommon, CLog } from './bluetooth-common';
import {
  StopNotifyingOptions,
  StartNotifyingOptions,
  ConnectOptions,
  StartScanningOptions,
  StartAdvertisingOptions
} from './index';

export class CBCentralManagerDelegateImpl extends NSObject implements CBCentralManagerDelegate {
  static ObjCProtocols = [CBCentralManagerDelegate];
  private _owner: WeakRef<Bluetooth>;
  private _callback: (result?) => void;
  static new(): CBCentralManagerDelegateImpl {
    return <CBCentralManagerDelegateImpl>super.new();
  }
  public initWithCallback(owner: WeakRef<Bluetooth>, callback: (result?) => void): CBCentralManagerDelegateImpl {
    this._owner = owner;
    this._callback = callback;
    return this;
  }

  /**
   * Invoked when the central manager discovers a peripheral while scanning.
   */
  public centralManagerDidDiscoverPeripheralAdvertisementDataRSSI(
    central: CBCentralManager,
    peripheral: CBPeripheral,
    advData: NSDictionary<string, any>, // [String: Any]
    RSSI: number
  ) {
    CLog(`----- CBCentralManagerDelegateImpl centralManager:didDiscoverPeripheral: ${peripheral.name} @ ${RSSI}`);
    const peri = this._owner.get().findPeripheral(peripheral.identifier.UUIDString);
    if (!peri) {
      this._owner.get()._peripheralArray.addObject(peripheral);
      if (this._owner.get()._onDiscovered) {
        let manufacturerId;
        let manufacturerData;
        if (advData.objectForKey(CBAdvertisementDataManufacturerDataKey)) {
          const manufacturerIdBuffer = this._owner
            .get()
            .toArrayBuffer(
              advData.objectForKey(CBAdvertisementDataManufacturerDataKey).subdataWithRange(NSMakeRange(0, 2))
            );
          manufacturerId = new DataView(manufacturerIdBuffer, 0).getUint16(0, true);
          manufacturerData = this._owner
            .get()
            .toArrayBuffer(
              advData
                .objectForKey(CBAdvertisementDataManufacturerDataKey)
                .subdataWithRange(
                  NSMakeRange(2, advData.objectForKey(CBAdvertisementDataManufacturerDataKey).length - 2)
                )
            );
        }

        this._owner.get()._onDiscovered({
          UUID: peripheral.identifier.UUIDString,
          name: peripheral.name,
          RSSI: RSSI,
          state: this._owner.get()._getState(peripheral.state),
          manufacturerId: manufacturerId,
          manufacturerData: manufacturerData
        });
      } else {
        CLog('----- !!! No onDiscovered callback specified');
      }
    }
  }

  /**
   * Invoked when the central manager’s state is updated.
   */
  public centralManagerDidUpdateState(central: CBCentralManager) {
    // if (central.state === CBCentralManagerStateUnsupported) {
    if (central.state === CBManagerState.Unsupported) {
      CLog(`WARNING: This hardware does not support Bluetooth Low Energy.`);
    }
  }

  /**
   * Invoked when the central manager is about to be restored by the system.
   */
  public centralManagerWillRestoreState(central: CBCentralManager, dict: NSDictionary<string, any>) {
    CLog(`----- CBCentralManagerDelegateImpl centralManager:willRestoreState`);
  }

  /**
   * Invoked when a connection is successfully created with a peripheral.
   */
  public centralManagerDidConnectPeripheral(central: CBCentralManager, peripheral: CBPeripheral) {
    CLog(`----- CBCentralManagerDelegateImpl centralManager:didConnectPeripheral: ${peripheral}`);

    // find the peri in the array and attach the delegate to that
    const peri = this._owner.get().findPeripheral(peripheral.identifier.UUIDString);
    CLog(`----- CBCentralManagerDelegateImpl centralManager:didConnectPeripheral: cached perio: ${peri}`);

    const cb = this._owner.get()._connectCallbacks[peripheral.identifier.UUIDString];
    const delegate = CBCentralManagerDelegateImpl.new().initWithCallback(this._owner, cb);
    CFRetain(delegate);
    peri.delegate = delegate;

    CLog("----- CBCentralManagerDelegateImpl centralManager:didConnectPeripheral, let's discover service");
    peri.discoverServices(null);
  }

  /**
   * Invoked when an existing connection with a peripheral is torn down.
   */
  public centralManagerDidDisconnectPeripheralError(
    central: CBCentralManager,
    peripheral: CBPeripheral,
    error?: NSError
  ) {
    // this event needs to be honored by the client as any action afterwards crashes the app
    const cb = this._owner.get()._disconnectCallbacks[peripheral.identifier.UUIDString];
    if (cb) {
      cb({
        UUID: peripheral.identifier.UUIDString,
        name: peripheral.name
      });
    } else {
      CLog(`***** centralManagerDidDisconnectPeripheralError() no disconnect callback found *****`);
    }
    const foundAt = this._owner.get()._peripheralArray.indexOfObject(peripheral);
    this._owner.get()._peripheralArray.removeObject(foundAt);
  }

  public centralManagerDidFailToConnectPeripheralError(
    central: CBCentralManager,
    peripheral: CBPeripheral,
    error?: NSError
  ) {
    // TODO send event to JS
    CLog(`----- CBCentralManagerDelegate centralManager:didFailToConnectPeripheral:error`);
    // this._callback(error);
  }
}

export class CBPeripheralDelegateImpl extends NSObject implements CBPeripheralDelegate {
  public static ObjCProtocols = [CBPeripheralDelegate];
  public _onWritePromise;
  public _onReadPromise;
  public _onNotifyCallback;
  private _servicesWithCharacteristics;
  private _services;
  private _owner: WeakRef<Bluetooth>;
  private _callback: (result?) => void;

  static new(): CBPeripheralDelegateImpl {
    return <CBPeripheralDelegateImpl>super.new();
  }
  public initWithCallback(owner: WeakRef<Bluetooth>, callback: (result?) => void): CBPeripheralDelegateImpl {
    this._owner = owner;
    this._callback = callback;
    this._servicesWithCharacteristics = [];
    return this;
  }

  /**
   * Invoked when you discover the peripheral’s available services.
   */
  public peripheralDidDiscoverServices(peripheral: CBPeripheral, error?: NSError) {
    // map native services to a JS object
    this._services = [];
    for (let i = 0; i < peripheral.services.count; i++) {
      const service = peripheral.services.objectAtIndex(i);
      this._services.push({
        UUID: service.UUID.UUIDString,
        name: service.UUID
      });
      // NOTE: discover all is slow
      peripheral.discoverCharacteristicsForService(null, service);
    }
  }

  /**
   * Invoked when you discover the included services of a specified service.
   */
  public peripheralDidDiscoverIncludedServicesForServiceError(
    peripheral: CBPeripheral,
    service: CBService,
    error?: NSError
  ) {
    CLog(`----- CBPeripheralDelegateImpl.peripheralDidDiscoverIncludedServicesForServiceError: ${error}`);
  }

  public peripheralDidDiscoverCharacteristicsForServiceError(
    peripheral: CBPeripheral,
    service: CBService,
    error?: NSError
  ) {
    if (error) {
      // TODO invoke reject and stop processing
      CLog(`----- CBPeripheralDelegateImpl.peripheralDidDiscoverCharacteristicsForServiceError: ${error}`);
      return;
    }
    const characteristics = [];
    for (let i = 0; i < service.characteristics.count; i++) {
      const characteristic = service.characteristics.objectAtIndex(i);
      const result = {
        UUID: characteristic.UUID.UUIDString,
        name: characteristic.UUID,
        // see serviceAndCharacteristicInfo in CBPer+Ext of Cordova plugin
        value: characteristic.value ? characteristic.value.base64EncodedStringWithOptions(0) : null,
        properties: this._getProperties(characteristic),
        // descriptors: this._getDescriptors(characteristic), // TODO we're not currently discovering these
        isNotifying: characteristic.isNotifying
        // permissions: characteristic.permissions // prolly not too useful - don't think we need this for iOS (BradMartin)
      };
      characteristics.push(result);

      for (let j = 0; j < this._services.length; j++) {
        const s = this._services[j];
        if (s.UUID === service.UUID.UUIDString) {
          s.characteristics = characteristics;
          this._servicesWithCharacteristics.push(s);
          // the same service may be found multiple times, so make sure it's not added yet
          this._services.splice(j, 1);
          break;
        }
      }

      // Could add this one day: get details about the characteristic
      // peripheral.discoverDescriptorsForCharacteristic(characteristic);
    }

    if (this._services.length === 0) {
      if (this._callback) {
        this._callback({
          UUID: peripheral.identifier.UUIDString,
          name: peripheral.name,
          state: this._owner.get()._getState(peripheral.state),
          services: this._servicesWithCharacteristics
        });
        this._callback = null;
      }
    }
  }

  /**
   * Invoked when you retrieve a specified characteristic’s value, or when
   * the peripheral device notifies your app that the characteristic’s
   * value has changed.
   */
  public peripheralDidUpdateValueForCharacteristicError(
    peripheral: CBPeripheral,
    characteristic: CBCharacteristic,
    error?: NSError
  ) {
    if (!characteristic) {
      CLog(
        `----- CBPeripheralDelegateImpl No CBCharacteristic for peripheralDidUpdateValueForCharacteristicError -----`
      );
      return;
    }

    if (error !== null) {
      // TODO handle.. pass in sep callback?
      CLog(`----- CBPeripheralDelegateImpl error @ peripheralDidUpdateValueForCharacteristicError ${error}`);
      return;
    }

    const result = {
      type: characteristic.isNotifying ? 'notification' : 'read',
      characteristicUUID: characteristic.UUID.UUIDString,
      valueRaw: characteristic.value,
      value: this._owner.get().toArrayBuffer(characteristic.value)
    };

    if (result.type === 'read') {
      if (this._onReadPromise) {
        this._onReadPromise(result);
      } else {
        CLog('No _onReadPromise found!');
      }
    } else {
      if (this._onNotifyCallback) {
        this._onNotifyCallback(result);
      } else {
        CLog('----- CALLBACK IS GONE! -----');
      }
    }
  }

  /**
   * Invoked when you write data to a characteristic’s value.
   */
  public peripheralDidWriteValueForCharacteristicError(
    peripheral: CBPeripheral,
    characteristic: CBCharacteristic,
    error?: NSError
  ) {
    CLog(`----- CBPeripheralDelegateImpl peripheral:didWriteValueForCharacteristic:error: ${error}`);
    if (this._onWritePromise) {
      this._onWritePromise({
        characteristicUUID: characteristic.UUID.UUIDString
      });
    } else {
      CLog('No _onWritePromise found!');
    }
  }

  /**
   * Invoked when the peripheral receives a request to start or stop
   * providing notifications for a specified characteristic’s value.
   */
  public peripheralDidUpdateNotificationStateForCharacteristicError(
    peripheral: CBPeripheral,
    characteristic: CBCharacteristic,
    error?: NSError
  ) {
    CLog(
      '----- CBPeripheralDelegateImpl peripheral:didUpdateNotificationStateForCharacteristic:error, error: ' + error
    );
    if (error) {
      CLog('----- CBPeripheralDelegateImpl peripheral:didUpdateNotificationStateForCharacteristic:error, ' + error);
    } else {
      if (characteristic.isNotifying) {
        CLog(`------ CBPeripheralDelegateImpl Notification began on ${characteristic}`);
      } else {
        CLog(`------ CBPeripheralDelegateImpl Notification stopped on  ${characteristic}, consider disconnecting`);
        // Bluetooth._manager.cancelPeripheralConnection(peripheral);
      }
    }
  }

  public peripheralDidDiscoverDescriptorsForCharacteristicError(
    peripheral: CBPeripheral,
    characteristic: CBCharacteristic,
    error?: NSError
  ) {
    // NOTE that this cb won't be invoked bc we currently don't discover descriptors
    CLog(`----- CBPeripheralDelegateImpl peripheral:didDiscoverDescriptorsForCharacteristic:error: ${error}`);

    // TODO extract details, see https://github.com/randdusing/cordova-plugin-bluetoothle/blob/master/src/ios/BluetoothLePlugin.m#L1844
    CLog(characteristic.descriptors);
    for (let i = 0; i < characteristic.descriptors.count; i++) {
      const descriptor = characteristic.descriptors.objectAtIndex(i);
      CLog(`char desc UUID: ${descriptor.UUID.UUIDString}`);
    }

    // now let's see if we're ready to invoke the callback
    if (this._services.length === this._servicesWithCharacteristics.length) {
      if (this._callback) {
        this._callback({
          UUID: peripheral.identifier.UUIDString,
          name: peripheral.name,
          state: this._owner.get()._getState(peripheral.state),
          services: this._services
        });
        this._callback = null;
      }
    }
  }

  /**
   * Invoked when you retrieve a specified characteristic descriptor’s value.
   */
  public peripheralDidUpdateValueForDescriptorError(
    peripheral: CBPeripheral,
    descriptor: CBDescriptor,
    error?: NSError
  ) {
    CLog('----- CBPeripheralDelegateImpl peripheral:didUpdateValueForDescriptor:error');
  }

  /**
   * IInvoked when you write data to a characteristic descriptor’s value.
   */
  public peripheralDidWriteValueForDescriptorError(
    peripheral: CBPeripheral,
    descriptor: CBDescriptor,
    error?: NSError
  ) {
    CLog('----- CBPeripheralDelegateImpl peripheral:didWriteValueForDescriptor:error');
  }

  private _getProperties(characteristic: CBCharacteristic) {
    const props = characteristic.properties;
    return {
      // broadcast: (props & CBCharacteristicPropertyBroadcast) === CBCharacteristicPropertyBroadcast,
      broadcast:
        (props & CBCharacteristicProperties.PropertyBroadcast) === CBCharacteristicProperties.PropertyBroadcast,
      read: (props & CBCharacteristicProperties.PropertyRead) === CBCharacteristicProperties.PropertyRead,
      broadcast2:
        (props & CBCharacteristicProperties.PropertyBroadcast) === CBCharacteristicProperties.PropertyBroadcast,
      read2: (props & CBCharacteristicProperties.PropertyRead) === CBCharacteristicProperties.PropertyRead,
      write: (props & CBCharacteristicProperties.PropertyWrite) === CBCharacteristicProperties.PropertyWrite,
      writeWithoutResponse:
        (props & CBCharacteristicProperties.PropertyWriteWithoutResponse) ===
        CBCharacteristicProperties.PropertyWriteWithoutResponse,
      notify: (props & CBCharacteristicProperties.PropertyNotify) === CBCharacteristicProperties.PropertyNotify,
      indicate: (props & CBCharacteristicProperties.PropertyIndicate) === CBCharacteristicProperties.PropertyIndicate,
      authenticatedSignedWrites:
        (props & CBCharacteristicProperties.PropertyAuthenticatedSignedWrites) ===
        CBCharacteristicProperties.PropertyAuthenticatedSignedWrites,
      extendedProperties:
        (props & CBCharacteristicProperties.PropertyExtendedProperties) ===
        CBCharacteristicProperties.PropertyExtendedProperties,
      notifyEncryptionRequired:
        (props & CBCharacteristicProperties.PropertyNotifyEncryptionRequired) ===
        CBCharacteristicProperties.PropertyNotifyEncryptionRequired,
      indicateEncryptionRequired:
        (props & CBCharacteristicProperties.PropertyIndicateEncryptionRequired) ===
        CBCharacteristicProperties.PropertyIndicateEncryptionRequired
    };
  }

  private _getDescriptors(characteristic) {
    const descs = characteristic.descriptors;
    const descsJs = [];
    for (let i = 0; i < descs.count; i++) {
      const desc = descs.objectAtIndex(i);
      CLog('--------- CBPeripheralDelegateImpl descriptor value: ' + desc.value);
      descsJs.push({
        UUID: desc.UUID.UUIDString,
        value: desc.value
      });
    }
    return descsJs;
  }
}

export class CBPeripheralManagerDelegateImpl extends NSObject implements CBPeripheralManagerDelegate {
  public static ObjCProtocols = [CBPeripheralManagerDelegate];
  private _owner: WeakRef<Bluetooth>;

  static new(): CBPeripheralManagerDelegateImpl {
    return <CBPeripheralManagerDelegateImpl>super.new();
  }

  public initWithCallback(owner: WeakRef<Bluetooth>, callback: (result?) => void): CBPeripheralManagerDelegateImpl {
    this._owner = owner;
    return this;
  }

  public peripheralManagerDidUpdateState(mgr: CBPeripheralManager) {
    CLog(`---- CBPeripheralManagerDelegateImpl peripheralManagerDidUpdateState`, mgr);
  }

  public peripheralManagerDidStartAdvertisingError(peripheral: CBPeripheralManager, error?: NSError) {
    CLog('----- CBPeripheralManagerDelegateImpl peripheralManagerDidStartAdvertising()', error);
  }

  public peripheralManagerDidAddError(peripheral: CBPeripheralManager, service: CBService, error?: NSError) {
    CLog('----- CBPeripheralManagerDelegateImpl peripheralManagerDidAddError()', error);
  }

  public peripheralManagerCentralDidSubscribeToCharacteristic(
    peripheral: CBPeripheralManager,
    central: CBCentral,
    characteristic: CBCharacteristic
  ) {
    CLog(
      '----- CBPeripheralManagerDelegateImpl peripheralManagerCentralDidSubscribeToCharacteristic()',
      characteristic
    );
  }

  // public peripheralManagerCentralDidUnsubscribeFromCharacteristic(
  //   peripheral: CBPeripheralManager,
  //   central: CBService,
  //   characteristic: CBCharacteristic
  // ) {
  //   CLog(
  //     '----- CBPeripheralManagerDelegateImpl peripheralManagerCentralDidSubscribeToCharacteristic()',
  //     characteristic
  //   );
  // }
}

export class Bluetooth extends BluetoothCommon {
  private _centralDelegate = CBCentralManagerDelegateImpl.new().initWithCallback(new WeakRef(this), obj => {
    CLog('----- centralDelegate obj: ' + obj);
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
    CLog('*** Bluetooth Constructor ***');
    CLog('this._centralManager', this._centralManager);
    CLog('this._peripheralManager', this._peripheralManager);
  }

  public _getState(state: CBPeripheralState) {
    if (state === CBPeripheralState.Connecting) {
      return 'connecting';
    } else if (state === CBPeripheralState.Connected) {
      return 'connected';
    } else if (state === CBPeripheralState.Disconnected) {
      return 'disconnected';
    } else {
      CLog(`Unexpected state, returning 'disconnected' for state of ${state}`);
      return 'disconnected';
    }
  }

  public isBluetoothEnabled() {
    return new Promise((resolve, reject) => {
      try {
        CLog('isBluetoothEnabled internal');
        const isEnabled = this._isEnabled();
        CLog('isEnabled', isEnabled);
        resolve(isEnabled);
      } catch (ex) {
        CLog(`Error in this.isBluetoothEnabled: ${ex}`);
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
        CLog('Error in Bluetooth.startScanning: ' + ex);
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
        CLog('startAdvertising begin');
        // const isAdv = this._peripheralManager.isAdvertising;
        // CLog('isAdvertising', isAdv);
        // if (isAdv) {
        //   CLog('peripheral is already advertising');
        //   resolve(`Already advertising the UUID: ${args.UUID}`);
        //   return;
        // }

        CLog('creating advertisement...');
        const uuid = CBUUID.UUIDWithString(args.UUID);

        const advertisement = NSDictionary.dictionaryWithObjectsForKeys(
          [[uuid], 'data_service'],
          [CBAdvertisementDataServiceUUIDsKey, CBAdvertisementDataLocalNameKey]
        );

        this._peripheralManager.startAdvertising(advertisement);

        CLog('advertising started');
        resolve();
      } catch (error) {
        CLog('startAdvertising error', error);
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
        CLog('newPM', newPM);
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
      CLog('Not possible on iOS');
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
        CLog(`Error in Bluetooth.stopScanning: ${ex}`);
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
        CLog('connect', args.UUID);
        const peripheral = this.findPeripheral(args.UUID);
        CLog('peripheral found', peripheral);
        if (peripheral === null) {
          reject(`Could not find peripheral with UUID: ${args.UUID}`);
        } else {
          CLog(`Connecting to peripheral with UUID: ${args.UUID}`);
          this._connectCallbacks[args.UUID] = args.onConnected;
          this._disconnectCallbacks[args.UUID] = args.onDisconnected;
          this._centralManager.connectPeripheralOptions(peripheral, null);
          resolve();
        }
      } catch (ex) {
        CLog('Error in Bluetooth.connect: ' + ex);
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
        if (peripheral === null) {
          reject('Could not find peripheral with UUID ' + arg.UUID);
        } else {
          CLog('Disconnecting peripheral with UUID: ' + arg.UUID);
          // no need to send an error when already disconnected, but it's wise to check it
          if (peripheral.state !== CBPeripheralState.Disconnected) {
            this._centralManager.cancelPeripheralConnection(peripheral);
            peripheral.delegate = null;
            // TODO remove from the peripheralArray as well
          }
          resolve();
        }
      } catch (ex) {
        CLog('Error in Bluetooth.disconnect: ' + ex);
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
          CLog('checking connection with peripheral UUID: ' + arg.UUID);
          resolve(peripheral.state === CBPeripheralState.Connected);
        }
      } catch (ex) {
        CLog('Error in Bluetooth.isConnected: ' + ex);
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
          // no need to reject, this has already been done
          return;
        }

        // TODO we could (should?) make this characteristic-specific
        (wrapper.peripheral.delegate as CBPeripheralDelegateImpl)._onReadPromise = resolve;
        wrapper.peripheral.readValueForCharacteristic(wrapper.characteristic);
      } catch (ex) {
        CLog(`Error in Bluetooth.read: ${ex}`);
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
        CLog('Error in Bluetooth.write: ' + ex);
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
        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const valueEncoded = this._encodeValue(arg.value);

        CLog('Attempting to write (encoded): ' + valueEncoded);

        wrapper.peripheral.writeValueForCharacteristicType(
          valueEncoded,
          wrapper.characteristic,
          // CBCharacteristicWriteWithoutResponse
          CBCharacteristicWriteType.WithoutResponse
        );

        resolve();
      } catch (ex) {
        CLog('Error in Bluetooth.writeWithoutResponse: ' + ex);
        reject(ex);
      }
    });
  }

  public startNotifying(args: StartNotifyingOptions) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(args, CBCharacteristicProperties.PropertyNotify, reject);
        CLog(`----- startNotifying wrapper: ${wrapper}`);

        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }
        const cb =
          args.onNotify ||
          function(result) {
            CLog(`No 'onNotify' callback function specified for 'startNotifying()'`);
          };

        // TODO we could (should?) make this characteristic-specific
        (wrapper.peripheral.delegate as CBPeripheralDelegateImpl)._onNotifyCallback = cb;
        wrapper.peripheral.setNotifyValueForCharacteristic(true, wrapper.characteristic);
        resolve();
      } catch (ex) {
        CLog(`Error in Bluetooth.startNotifying: ${ex}`);
        reject(ex);
      }
    });
  }

  public stopNotifying(args: StopNotifyingOptions) {
    return new Promise((resolve, reject) => {
      try {
        const wrapper = this._getWrapper(args, CBCharacteristicProperties.PropertyNotify, reject);
        CLog(`----- stopNotifying wrapper: ${wrapper}`);

        if (wrapper === null) {
          // no need to reject, this has already been done
          return;
        }

        const peripheral = this.findPeripheral(args.peripheralUUID);
        // peripheral.delegate = null;
        peripheral.setNotifyValueForCharacteristic(false, wrapper.characteristic);
        resolve();
      } catch (ex) {
        CLog('Error in Bluetooth.stopNotifying: ' + ex);
        reject(ex);
      }
    });
  }

  private _isEnabled() {
    const state = this._centralManager.state;
    CLog('current manager state', this._centralManager.state);
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
        // CLog("--- found our service with UUID: " + service.UUID);
        return service;
      }
    }
    // service not found on this peripheral
    return null;
  }

  private _findCharacteristic(UUID, service, property) {
    // CLog("--- _findCharacteristic UUID: " + UUID);
    CLog(`----- _findCharacteristic characteristics: ${service.characteristics}`);
    // CLog("--- _findCharacteristic characteristics.count: " + service.characteristics.count);
    for (let i = 0; i < service.characteristics.count; i++) {
      const characteristic = service.characteristics.objectAtIndex(i);
      // CLog("--- characteristic.UUID: " + characteristic.UUID);
      if (UUID.UUIDString === characteristic.UUID.UUIDString) {
        // if (property) {
        //   if ((characteristic.properties & property) === property) {
        if (property && characteristic.properties) {
          if (property === property) {
            CLog(`--- characteristic.found: ${characteristic.UUID}`);
            return characteristic;
          }
        } else {
          return characteristic;
        }
      }
    }
    // characteristic not found on this service
    CLog('--- characteristic.NOT.found!');
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

  private setup_data_service(peripheral: CBPeripheralManager) {
    this._data_service.includedServices = NSArray.array();
    //  iOS_Utils.collections.jsArrayToNSArray([]);
    this._peripheralManager.removeService(this._data_service);
    this._peripheralManager.stopAdvertising();

    const data_service = CBMutableService.alloc().initWithTypePrimary(PushTrackerServiceID.data_service.cb_uuid, true);
    CLog('data_service', data_service);
    this._data_service = data_service;

    // const data_control_characteristic = CBMutableCharacteristic.alloc().initWithTypePropertiesValuePermissions(
    //   PushTrackerServiceID.data_control.cb_uuid,
    //   [
    //     CBCharacteristicProperties.PropertyWrite,
    //     CBCharacteristicProperties.PropertyRead,
    //     CBCharacteristicProperties.PropertyNotify
    //   ],
    //   null,
    //   CBAttributePermissions.Readable,
    //   CBAttributePermissions.Writeable[('readable', 'writeable')]
    // );

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
