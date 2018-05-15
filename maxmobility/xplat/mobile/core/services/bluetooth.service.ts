/// <reference path="../../../typings/android27.d.ts" />

// angular
import { Injectable } from '@angular/core';

// nativescript
import * as dialogsModule from 'tns-core-modules/ui/dialogs';
import { isAndroid } from 'tns-core-modules/platform';
import { fromObject } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

// libs
import * as Toast from 'nativescript-toast';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { Bluetooth, CharacteristicProperties } from 'nativescript-bluetooth';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';

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
    this._bluetooth.debug = false;

    // setup event listeners
    this._bluetooth.on(Bluetooth.bond_status_change_event, this.onBondStatusChange.bind(this));
    this._bluetooth.on(Bluetooth.peripheral_connected_event, this.onPeripheralConnected.bind(this));
    this._bluetooth.on(Bluetooth.device_discovered_event, this.onDeviceDiscovered.bind(this));
    this._bluetooth.on(Bluetooth.device_name_change_event, this.onDeviceNameChange.bind(this));
    this._bluetooth.on(Bluetooth.device_uuid_change_event, this.onDeviceUuidChange.bind(this));
    this._bluetooth.on(Bluetooth.device_acl_disconnected_event, this.onDeviceAclDisconnected.bind(this));
    this._bluetooth.on(Bluetooth.server_connection_state_changed_event, this.onServerConnectionStateChanged.bind(this));
    this._bluetooth.on(Bluetooth.characteristic_write_request_event, this.onCharacteristicWriteRequest.bind(this));
    this._bluetooth.on(Bluetooth.bluetooth_advertise_failure_event, args => {
      console.log(Bluetooth.bluetooth_advertise_failure_event, args);
    });

    this.advertise();
  }

  public clearSmartDrives() {
    BluetoothService.SmartDrives.splice(0, BluetoothService.SmartDrives.length);
  }

  public clearPushTrackers() {
    BluetoothService.PushTrackers.splice(0, BluetoothService.PushTrackers.length);
  }

  public async initialize() {
    this.enabled = false;
    this.initialized = false;
    return this._bluetooth
      .requestCoarseLocationPermission()
      .then(() => {
        return this.deleteServices();
      })
      .then(() => {
        if (this.enabled === true) {
          this.addServices();
          this.initialized = true;
        } else {
          console.log('Bluetooth is not enabled.');
        }
      })
      .catch(ex => {
        console.log('location permission error', ex);
      });
  }

  public async advertise() {
    return this.initialize()
      .then(() => {
        return this._bluetooth.startAdvertising({
          UUID: BluetoothService.AppServiceUUID,
          settings: {
            connectable: true
          },
          data: {
            includeDeviceName: true
          }
        });
      })
      .then(() => {
        this._bluetooth.addService(this.AppService);
        console.log('Advertising Started!');
      })
      .catch(err => {
        console.log('advertising err', err);
      });
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

  public disconnect(args: any) {
    // TODO: doesn't properly disconnect
    this._bluetooth.disconnect(args);
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

  public restart(): Promise<any> {
    this.enabled = false;
    this.initialized = false;
    return this._bluetooth
      .disable()
      .then(() => {
        return this._bluetooth.enable();
      })
      .then(wasEnabled => {
        this.enabled = wasEnabled;
        console.log(`BLUETOOTH WAS ENABLED? ${this.enabled}`);
        if (this.enabled) {
          console.log('Starting GattServer');
          this._bluetooth.startGattServer();
        }
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        });
      })
      .catch(err => {
        this.enabled = false;
        this.initialized = false;
        console.log('enable err', err);
      });
  }

  // private functions
  // event listeners
  private onBondStatusChange(args: any): void {
    const dev = args.data.device;
    const bondState = args.data.bs;
    console.log(`${dev} - bond state - ${bondState}`);
    switch (bondState) {
      case android.bluetooth.BluetoothDevice.BOND_BONDING:
        break;
      case android.bluetooth.BluetoothDevice.BOND_BONDED:
        this._bluetooth.removeBond(dev);
        const pt = this.getOrMakePushTracker(dev.getAddress());
        pt.handlePaired();
        this.feedback.success({
          title: 'Successfully Paired',
          message: `PushTracker ${pt.address} now paired`
        });
        break;
      case android.bluetooth.BluetoothDevice.BOND_NONE:
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
    //console.log(`name change!`);
    const dev = args.data.device;
    const name = args.data.name;
    console.log(`${dev} - name change - ${name || 'None'}`);
  }

  private onDeviceUuidChange(args: any): void {
    //console.log(`uuid change!`);
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
    //console.log('finished uuid change');
  }

  private onDeviceAclDisconnected(args: any): void {
    //console.log(`acl disconnect!`);
    const peripheral = args.data.device; // of type Peripheral
    const address = peripheral.address || peripheral.getAddress();
    const name = peripheral.name || peripheral.getName();
    console.log(`${name}::${address} - disconnected`);
    if (this.isSmartDrive(peripheral)) {
      const sd = this.getOrMakeSmartDrive(address);
      sd.handleDisconnect();
    } else if (this.isPushTracker(peripheral)) {
      const pt = this.getOrMakePushTracker(address);
      pt.handleDisconnect();
    }
    //console.log('finished acl disconnect');
  }

  private onServerConnectionStateChanged(args: any): void {
    //console.log(`server connection state change!`);
    const newState = args.data.newState;
    const device = args.data.device;
    console.log(`state change - ${device} - ${newState}`);
    switch (newState) {
      case android.bluetooth.BluetoothProfile.STATE_CONNECTED:
        device.fetchUuidsWithSdp();
        // TODO: use BluetoothGatt to get the service (by UUID 1800)

        // TODO: use the returned service to get the characteristic
        //       (by UUID 2a00)

        // TODO: use the returned characteristic to call
        //       'getStringValue()' to read the characteristic to get
        //       the name
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device.getAddress());
          pt.handleConnect();
          this.notify(`${device.getName()}::${device} connected`);
        }
        break;
      case android.bluetooth.BluetoothProfile.STATE_CONNECTING:
        break;
      case android.bluetooth.BluetoothProfile.STATE_DISCONNECTED:
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device.getAddress());
          pt.handleDisconnect();
          this.notify(`${device.getName()}::${device} disconnected`);
        }
        break;
      case android.bluetooth.BluetoothProfile.STATE_DISCONNECTING:
        break;
      default:
        break;
    }
    //console.log(`finished server connection state change!`);
  }

  private onPeripheralConnected(args: any): void {
    console.log('peripheral discovered!');
    const peripheral = args.data.device;
    // TODO: this event is not emitted by the bluetooth library
    //console.log('finished peripheral discovered!');
  }

  private onCharacteristicWriteRequest(args: any): void {
    const value = args.data.value;
    const device = args.data.device;
    const data = new Uint8Array(value);
    const p = new Packet();
    p.initialize(data);

    if (this.isPushTracker(device)) {
      const pt = this.getOrMakePushTracker(device.getAddress());
      pt.handlePacket(p);
    }
    console.log(`${p.Type()}::${p.SubType()} ${p.toString()}`);
    p.destroy();
  }

  private onCharacteristicReadRequest(args: any): void {}

  // service controls
  private deleteServices(): Promise<any> {
    console.log('deleting any existing services');
    this._bluetooth.clearServices();
    PushTracker.DataCharacteristic = null;
    return this.restart();
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
    if (PushTracker.DataCharacteristic) {
      return PushTracker.DataCharacteristic.setValue(data);
    } else {
      return false;
    }
  }

  public notifyPushTrackers(addresses: any): Promise<any> {
    const connectedDevices = this._bluetooth.getServerConnectedDevices();
    let jsConnDev = [];
    let length = connectedDevices.size();
    for (let i = 0; i < length; i++) {
      jsConnDev.push(`${connectedDevices.get(i)}`);
    }
    //console.log(`Notifying pushtrackers: ${addresses}`);

    const notify = addr => {
      return new Promise((resolve, reject) => {
        const dev = jsConnDev.filter(d => {
          return d == addr;
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
    const UUIDs = dev && dev.getUuids();
    console.log(UUIDs);
    const name = dev && dev.getName();
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

  private selectDialog(options: any): Promise<any> {
    // options should be of form....
    return new Promise((resolve, reject) => {
      dialogsModule
        .action({
          message: options.message || 'Select',
          cancelButtonText: options.cancelButtonText || 'Cancel',
          actions: options.actions || []
        })
        .then(result => {
          resolve(result !== 'Cancel' ? result : null);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}
