/// <reference path="../../../typings/android27.d.ts" />

import { Injectable } from '@angular/core';
import * as dialogsModule from 'tns-core-modules/ui/dialogs';
import { isAndroid } from 'tns-core-modules/platform';
import { fromObject } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { Bluetooth, BondState, ConnectionState } from 'nativescript-bluetooth';

@Injectable()
export class BluetoothService {
  // static members
  public static AppServiceUUID = '9358ac8f-6343-4a31-b4e0-4b13a2b45d86';
  public static PushTrackers = new ObservableArray<PushTracker>();
  public static SmartDrives = new ObservableArray<SmartDrive>();

  // public members
  public enabled = false;
  public initialized = false;

  // private members
  private _bluetooth = new Bluetooth();
  private PushTrackerDataCharacteristic: any = null;
  private AppService: any = null;
  private snackbar = new SnackBar();
  private feedback = new Feedback();

  constructor() {
    // enabling `debug` will output console.logs from the bluetooth source code
    this._bluetooth.debug = true;
    this.advertise().catch(err => {
      const msg = `bluetooth.service::advertise error: ${err}`;
      dialogsModule
        .alert({
          title: 'Bluetooth Service failure',
          message: msg,
          okButtonText: 'OK'
        })
        .then(() => {
          console.log(msg);
        });
    });

    this.setEventListeners();
  }

  public setEventListeners() {
    this.clearEventListeners();
    // setup event listeners
    this._bluetooth.on(Bluetooth.bond_status_change_event, this.onBondStatusChange, this);
    this._bluetooth.on(Bluetooth.peripheral_connected_event, this.onPeripheralConnected, this);
    this._bluetooth.on(Bluetooth.device_discovered_event, this.onDeviceDiscovered, this);
    this._bluetooth.on(Bluetooth.device_name_change_event, this.onDeviceNameChange, this);
    this._bluetooth.on(Bluetooth.device_uuid_change_event, this.onDeviceUuidChange, this);
    this._bluetooth.on(Bluetooth.device_acl_disconnected_event, this.onDeviceAclDisconnected, this);

    this._bluetooth.on(Bluetooth.centralmanager_updated_state_event, args => {
      console.log('centralmanager_updated_state_event');
    });

    this._bluetooth.on(Bluetooth.server_connection_state_changed_event, this.onServerConnectionStateChanged, this);
    this._bluetooth.on(Bluetooth.characteristic_write_request_event, this.onCharacteristicWriteRequest, this);
    this._bluetooth.on(Bluetooth.bluetooth_advertise_failure_event, this.onAdvertiseFailure, this);
    this._bluetooth.on(Bluetooth.bluetooth_advertise_success_event, this.onAdvertiseSuccess, this);
  }

  public clearEventListeners() {
    // setup event listeners
    this._bluetooth.off(Bluetooth.bond_status_change_event);
    this._bluetooth.off(Bluetooth.peripheral_connected_event);
    this._bluetooth.off(Bluetooth.device_discovered_event);
    this._bluetooth.off(Bluetooth.device_name_change_event);
    this._bluetooth.off(Bluetooth.device_uuid_change_event);
    this._bluetooth.off(Bluetooth.device_acl_disconnected_event);
    this._bluetooth.off(Bluetooth.server_connection_state_changed_event);
    this._bluetooth.off(Bluetooth.characteristic_write_request_event);
    this._bluetooth.off(Bluetooth.bluetooth_advertise_failure_event);
    this._bluetooth.off(Bluetooth.bluetooth_advertise_success_event);
  }

  public clearSmartDrives() {
    BluetoothService.SmartDrives.splice(0, BluetoothService.SmartDrives.length);
  }

  public clearPushTrackers() {
    BluetoothService.PushTrackers.splice(0, BluetoothService.PushTrackers.length);
  }

  public radioEnabled(): Promise<boolean> {
    return this._bluetooth.isBluetoothEnabled();
  }

  public available(): Promise<boolean> {
    return this.isActive();

    // return this._bluetooth.isBluetoothEnabled().then(enabled => {
    //   return enabled && this.isActive();
    // });
  }

  public isActive(): Promise<boolean> {
    return Promise.resolve(this.enabled && this.initialized); // && this._bluetooth.offersService(BluetoothService.AppServiceUUID);
  }

  public async initialize(): Promise<any> {
    this.enabled = false;
    this.initialized = false;

    this.clearEventListeners();
    this.setEventListeners();

    const x = await this._bluetooth.requestCoarseLocationPermission().catch(error => {
      console.log('requestCoarseLocationPermission error', error);
    });
    this.enabled = true;

    this._bluetooth.startGattServer();

    this.addServices();

    this.initialized = true;

    // if (this.enabled === true) {
    // } else {
    //   console.log('Bluetooth is not enabled.');
    // }

    // return this._bluetooth
    //   .requestCoarseLocationPermission()
    //   .then(() => {
    //     // return this.restart();
    //   })
    //   .then(() => {
    //     if (this.enabled === true) {
    //       this.addServices();
    //       this.initialized = true;
    //     } else {
    //       console.log('Bluetooth is not enabled.');
    //     }
    //   });
  }

  public async advertise(): Promise<any> {
    await this.initialize();

    this._bluetooth.addService(this.AppService);

    await this._bluetooth.startAdvertising({
      UUID: BluetoothService.AppServiceUUID,
      settings: {
        connectable: true
      },
      data: {
        includeDeviceName: true
      }
    });

    // this._bluetooth.addService(this.AppService);
    console.log('Advertising Started!');

    // return this.initialize()
    //   .then(() => {
    //     return this._bluetooth.startAdvertising({
    //       UUID: BluetoothService.AppServiceUUID,
    //       settings: {
    //         connectable: true
    //       },
    //       data: {
    //         includeDeviceName: true
    //       }
    //     });
    //   })
    //   .then(() => {
    //     this._bluetooth.addService(this.AppService);
    //     console.log('Advertising Started!');
    //   });
  }

  public scanForAny(timeout: number = 4): Promise<any> {
    return this.scan([], timeout);
  }

  public scanForSmartDrive(timeout: number = 4): Promise<any> {
    this.clearSmartDrives();
    return this.scan([SmartDrive.ServiceUUID], timeout);
  }

  // returns a promise that resolves when scanning completes
  public scan(uuids: string[], timeout: number = 4): Promise<any> {
    return this._bluetooth.startScanning({
      serviceUUIDs: uuids,
      seconds: timeout
    });
  }

  public stopScanning(): Promise<any> {
    return this._bluetooth.stopScanning();
  }

  public connect(address: string, onConnected?: any, onDisconnected?: any) {
    this._bluetooth.connect({
      UUID: address,
      onConnected: onConnected,
      onDisconnected: onDisconnected
    });
  }

  public disconnectAll(): Promise<any> {
    // TODO: the android implementation of these functions don't
    //       work

    // TODO: update to be cross-platform
    return Promise.resolve();
    /*
        let tasks = [];
        const gattDevices = this._bluetooth.getConnectedDevices();
        const gattServerDevices = this._bluetooth.getServerConnectedDevices();
        console.log(`Disconnecting from all devices: ${gattDevices}, ${gattServerDevices}`);
        if (gattDevices && gattDevices.length) {
            tasks = gattDevices.map(device => {
                console.log(`disconnecting from ${device}`);
                return this._bluetooth.disconnect({ UUID: `${device}` });
            });
        }
        if (gattServerDevices && gattServerDevices.length) {
            tasks = gattServerDevices.map(device => {
                console.log(`disconnecting from ${device}`);
                return this._bluetooth.cancelServerConnection(device);
            });
        }
        return Promise.all(tasks);
        */
  }

  public disconnect(args: any): Promise<any> {
    return this._bluetooth.disconnect(args);
  }

  public discoverServices(opts: any) {}

  public discoverCharacteristics(opts: any) {}

  public startNotifying(opts: any) {
    return this._bluetooth.startNotifying(opts);
  }

  public stopNotifying(opts: any) {
    return this._bluetooth.stopNotifying(opts);
  }

  public write(opts: Bluetooth.WriteOptions) {
    return this._bluetooth.write(opts);
  }

  public async stop(): Promise<any> {
    this.enabled = false;
    this.initialized = false;
    // remove the services
    this.deleteServices();
    // stop the gatt server
    this._bluetooth.stopGattServer();
    // stop listening for events
    this.clearEventListeners();
    // stop advertising
    await this.disconnectAll();
    this._bluetooth.stopAdvertising();
    // return this.disconnectAll().then(() => {
    //   return this._bluetooth.stopAdvertising();
    // });
  }

  public restart(): Promise<any> {
    return this.stop()
      .then(() => {
        return this._bluetooth.isBluetoothEnabled();
      })
      .then(enabled => {
        if (enabled) {
          return enabled;
        } else {
          if (isAndroid) {
            return this._bluetooth.enable();
          } else {
            throw new String('on iOS but bluetooth not enabled!');
          }
        }
      })
      .then(wasEnabled => {
        this.enabled = wasEnabled;
        console.log(`BLUETOOTH WAS ENABLED? ${this.enabled}`);
        if (this.enabled) {
          return this.advertise();
        } else {
          throw new String("Bluetooth was not enabled, couldn't start gattServer!");
        }
      })
      .catch(err => {
        this.enabled = false;
        this.initialized = false;
        console.log('enable err', err);
      });
  }

  // private functions
  // event listeners
  private onAdvertiseFailure(args: any): void {
    console.log(`Advertise failure: ${args.data.error}`);
  }

  private onAdvertiseSuccess(args: any): void {
    console.log(`Advertise succeeded`);
  }

  private onBondStatusChange(args: any): void {
    const dev = args.data.device as Central;
    const bondState = args.data.bondState;
    console.log(`${dev.address} - bond state - ${bondState}`);
    switch (bondState) {
      case BondState.bonding:
        break;
      case BondState.bonded:
        if (isAndroid) {
          this._bluetooth.removeBond(dev.android);
        }
        const pt = this.getOrMakePushTracker(dev.address);
        pt.handlePaired();
        this.feedback.success({
          title: 'Successfully Paired',
          message: `PushTracker ${pt.address} now paired`
        });
        break;
      case BondState.none:
        break;
      default:
        break;
    }
  }

  private onDeviceDiscovered(args: any): void {
    const peripheral = args.data.data; // of type Peripheral
    console.log(`${peripheral.UUID}::${peripheral.name} - discovered`);
    if (this.isSmartDrive(peripheral)) {
      const address = peripheral.UUID;
      const sd = this.getOrMakeSmartDrive(address);
    }
  }

  private onDeviceNameChange(args: any): void {
    console.log(`name change!`);
    const dev = args.data.device;
    const name = args.data.name;
    console.log(`${dev.address} - name change - ${name || 'None'}`);
  }

  private onDeviceUuidChange(args: any): void {
    console.log(`uuid change!`);
    // TODO: This function doesn't work (android BT impl returns null)
    /*
        const dev = args.data.device;
        console.log('uuid:', args.data.uuids);
        if (!args.data.uuids) {
            console.log('no uuid returned');
            return;
        }
        const newUUID = args.data.uuids[0].toString();
        console.log(`${dev} - uuid change - ${newUUID || 'None'}`);
        if (this.isSmartDrive(dev)) {
            const address = dev.UUID;
            const sd = this.getOrMakeSmartDrive(address);
        } else if (this.isPushTracker(dev)) {
            const address = dev.getAddress();
            const pt = this.getOrMakePushTracker(address);
        }
        */
    //console.log('finished uuid change');
  }

  private onDeviceAclDisconnected(args: any): void {
    //console.log(`acl disconnect!`);
    // TODO: should be only of type Peripheral
    const device = args.data.device;
    console.log(`${device.name}::${device.address} - disconnected`);
    if (this.isSmartDrive(device)) {
      const sd = this.getOrMakeSmartDrive(device.address);
      sd.handleDisconnect();
    } else if (this.isPushTracker(device)) {
      const pt = this.getOrMakePushTracker(device.address);
      pt.handleDisconnect();
    }
    //console.log('finished acl disconnect');
  }

  private onServerConnectionStateChanged(args: any): void {
    console.log(`server connection state change`);
    const connection_state = args.data.connection_state;
    const device = args.data.device;
    console.log(`state change - ${device} - ${connection_state}`);
    switch (connection_state) {
      case ConnectionState.connected:
        // NOTE : need to figure out the iOS piece for this
        // since this is android method for the device - could
        // be something we move into the bluetooth layer

        // TODO: move this into the bluetooth layer!
        //device.fetchUuidsWithSdp();

        // TODO: use BluetoothGatt to get the service (by UUID 1800)

        // TODO: use the returned service to get the characteristic
        //       (by UUID 2a00)

        // TODO: use the returned characteristic to call
        //       'getStringValue()' to read the characteristic to get
        //       the name
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device.address);
          pt.handleConnect();
          this.notify(`${device.name}::${device.address} connected`);
        }
        break;
      case ConnectionState.disconnected:
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device.address);
          pt.handleDisconnect();
          this.notify(`${device.name}::${device.address} disconnected`);
        }
        break;
      default:
        break;
    }
    //console.log(`finished server connection state change!`);
  }

  private onPeripheralConnected(args: any): void {
    console.log('peripheral discovered!');
    const peripheral = args.data.device;
    // TODO: this event is not emitted by the android part of the bluetooth library
    //console.log('finished peripheral discovered!');
  }

  private onCharacteristicWriteRequest(args: any): void {
    const value = args.data.value;
    const device = args.data.device;
    const data = new Uint8Array(value);
    const p = new Packet();
    p.initialize(data);

    if (this.isPushTracker(device)) {
      const pt = this.getOrMakePushTracker(device.address);
      pt.handlePacket(p);
    }
    console.log(`${p.Type()}::${p.SubType()} ${p.toString()}`);
    p.destroy();
  }

  private onCharacteristicReadRequest(args: any): void {}

  // service controls
  private deleteServices() {
    console.log('deleting any existing services');
    this._bluetooth.clearServices();
    PushTracker.DataCharacteristic = null;
  }

  private addServices(): void {
    try {
      if (this._bluetooth.offersService(BluetoothService.AppServiceUUID)) {
        console.log(`Bluetooth already offers ${BluetoothService.AppServiceUUID}`);
        return;
      }
      console.log('making service');

      // this.AppService = this._bluetooth.makeService({
      //   UUID: BluetoothService.AppServiceUUID,
      //   serviceType: android.bluetooth.BluetoothGattService.SERVICE_TYPE_PRIMARY
      // });

      this.AppService = this._bluetooth.makeService({
        UUID: BluetoothService.AppServiceUUID,
        primary: true
      });

      console.log('this.AppService', this.AppService);

      const descriptorUUIDs = ['2900', '2902'];
      PushTracker.Characteristics.map(cuuid => {
        console.log('Making characteristic: ' + cuuid);
        // const c = this._bluetooth.makeCharacteristic({
        //   UUID: cuuid,
        //   gattProperty:
        //     android.bluetooth.BluetoothGattCharacteristic.PROPERTY_READ |
        //     android.bluetooth.BluetoothGattCharacteristic.PROPERTY_WRITE |
        //     android.bluetooth.BluetoothGattCharacteristic.PROPERTY_NOTIFY,
        //   gattPermissions:
        //     android.bluetooth.BluetoothGattCharacteristic.PERMISSION_WRITE |
        //     android.bluetooth.BluetoothGattCharacteristic.PERMISSION_READ
        // });

        //  defaults props are set READ/WRITE/NOTIFY, perms are set to READ/WRITE
        const c = this._bluetooth.makeCharacteristic({
          UUID: cuuid
        });

        console.log('making descriptors');
        const descriptors = descriptorUUIDs.map(duuid => {
          // const d = this._bluetooth.makeDescriptor({
          //   UUID: duuid,
          //   permissions:
          //     android.bluetooth.BluetoothGattDescriptor.PERMISSION_READ |
          //     android.bluetooth.BluetoothGattDescriptor.PERMISSION_WRITE
          // });

          const d = this._bluetooth.makeDescriptor({
            UUID: duuid
          });

          if (isAndroid) {
            d.setValue(new Array([0x00, 0x00]));
          } else {
            d.value = new Array([0x00, 0x00]);
          }

          console.log('Making descriptor: ' + duuid);
          return d;
        });

        // need to test this, mainly iOS part
        if (isAndroid) {
          descriptors.map(d => {
            c.addDescriptor(d);
          });
        } else {
          c.descriptors = descriptors;
        }

        if (isAndroid) {
          c.setValue(0, android.bluetooth.BluetoothGattCharacteristic.FORMAT_UINT8, 0);
          c.setWriteType(android.bluetooth.BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
        } else {
          // TODO: write iOS impl here!
        }

        // store the characteristic here
        if (cuuid === PushTracker.DataCharacteristicUUID) {
          PushTracker.DataCharacteristic = c;
        }

        console.log('Adding characteristic to service!');
        this.AppService.addCharacteristic(c);
      });
    } catch (ex) {
      console.log(ex);
    }
  }

  private getOrMakePushTracker(address: string): PushTracker {
    let pt = BluetoothService.PushTrackers.filter(p => p.address === address)[0];
    //console.log(`Found PT: ${pt}`);
    if (pt === null || pt === undefined) {
      pt = new PushTracker(this, { address });
      BluetoothService.PushTrackers.push(pt);
    }
    //console.log(`Found or made PT: ${pt}`);
    return pt;
  }

  private getOrMakeSmartDrive(address: string): SmartDrive {
    let sd = BluetoothService.SmartDrives.filter((x: SmartDrive) => x.address === address)[0];
    //console.log(`Found SD: ${sd}`);
    if (sd === null || sd === undefined) {
      sd = new SmartDrive(this, { address });
      BluetoothService.SmartDrives.push(sd);
    }
    //console.log(`Found or made SD: ${sd}`);
    return sd;
  }

  public disconnectPushTrackers(addresses: string[]) {
    addresses.map(addr => {
      this._bluetooth.cancelServerConnection(addr);
    });
  }

  public sendToPushTrackers(data: any) {
    // TODO: this is android specific code - need an iOS version
    if (PushTracker.DataCharacteristic) {
      return PushTracker.DataCharacteristic.setValue(data);
    } else {
      return false;
    }
  }

  public notifyPushTrackers(addresses: any): Promise<any> {
    // TODO: this is android specific code - need an iOS version
    const connectedDevices = this._bluetooth.getServerConnectedDevices();
    const jsConnDev = [];
    const length = connectedDevices.size();
    for (let i = 0; i < length; i++) {
      jsConnDev.push(`${connectedDevices.get(i)}`);
    }
    //console.log(`Notifying pushtrackers: ${addresses}`);

    const notify = addr => {
      return new Promise((resolve, reject) => {
        const dev = jsConnDev.filter(d => {
          return d === addr;
        });
        if (dev.length) {
          const timeoutID = setTimeout(() => {
            reject('notify timeout!');
          }, 10000);
          // handle when the notification is sent
          const notificationSent = args => {
            clearTimeout(timeoutID);
            const device = args.data.device;
            const status = args.data.status;
            //console.log(`notificationSent: ${device} : ${status}`);
            this._bluetooth.off(Bluetooth.notification_sent_event, notificationSent);
            if (status) {
              // GATT_SUCCESS is 0x00
              reject(`notify status error: ${status}`);
            } else {
              resolve();
            }
          };
          // register for when notification is sent
          this._bluetooth.on(Bluetooth.notification_sent_event, notificationSent);
          //console.log(`notifying ${addr}!`);
          // tell it to send the notification
          this._bluetooth.notifyCentral(
            connectedDevices.get(jsConnDev.indexOf(dev[0])),
            PushTracker.DataCharacteristic,
            true
          );
        } else {
          reject();
        }
      });
    };

    // return the promise chain from last element
    return addresses.reduce(function(chain, item) {
      // bind item to first argument of function handle, replace `null` context as necessary
      return chain.then(notify.bind(null, item));
      // start chain with promise of first item
    }, notify(addresses.shift()));
  }

  public getPushTracker(address: string) {
    return BluetoothService.PushTrackers.filter(p => p.address === address)[0];
  }

  public getSmartDrive(address: string) {
    return BluetoothService.SmartDrives.filter(sd => sd.address === address)[0];
  }

  private isSmartDrive(dev: any): boolean {
    const name = dev && dev.name;
    const uuid = dev && dev.UUID;
    const isSD = (name && name.includes('Smart Drive DU')) || (uuid && uuid === SmartDrive.ServiceUUID);
    //console.log(`isSD: ${isSD}`);
    return isSD;
  }

  private isPushTracker(dev: any): boolean {
    const UUIDs = dev && dev.UUIDs;
    const name = dev && dev.name;
    const isPT =
      (name && name.includes('PushTracker')) ||
      (name && name.includes('Bluegiga')) ||
      (UUIDs && UUIDs.indexOf && UUIDs.indexOf(PushTracker.ServiceUUID) > -1);
    //console.log(`isPT: ${isPT}`);
    return isPT;
  }

  private notify(text: string): void {
    this.snackbar.simple(text);
  }
}
