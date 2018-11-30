import { Injectable } from '@angular/core';
import { Packet, PushTracker, SmartDrive } from '@maxmobility/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Bluetooth,
  BondState,
  Central,
  ConnectionState
} from 'nativescript-bluetooth';
import { Feedback } from 'nativescript-feedback';
import { SnackBar } from 'nativescript-snackbar';
import { Observable, fromObject } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { alert } from 'tns-core-modules/ui/dialogs';
import { LoggingService } from './logging.service';

export enum PushTrackerState {
  unknown,
  paired,
  disconnected,
  connected,
  ready
}

@Injectable()
export class BluetoothService {
  // static members
  public static AppServiceUUID = '9358ac8f-6343-4a31-b4e0-4b13a2b45d86';
  public static PushTrackers = new ObservableArray<PushTracker>();
  public static SmartDrives = new ObservableArray<SmartDrive>();

  /**
   * Observable to monitor the push tracker connectivity status. The MaxActionBar uses this to display the correct icon.
   */
  public static pushTrackerStatus: Observable = fromObject({
    state: PushTrackerState.unknown
  });

  /**
   * Once a PT has been paired successfully this will be true
   * Then we can ensure the actionbar icon is updated that it at least knows the app has paired before to a PT.
   */
  public static hasPairedToPushtrackerPreviously = false; // BRAD NOTE: this might need to be outside the service and stored in data (file) so we can load on subsequent runs

  // public members
  public enabled = false;
  public initialized = false;

  // private members
  private _bluetooth = new Bluetooth();
  private PushTrackerDataCharacteristic: any = null;
  private AppService: any = null;
  private snackbar = new SnackBar();
  private feedback = new Feedback();

  constructor(
    private _translateService: TranslateService,
    private _loggingService: LoggingService
  ) {
    // enabling `debug` will output console.logs from the bluetooth source code
    this._bluetooth.debug = false;

    // check to make sure that bluetooth is enabled, or this will always fail and we don't need to show the error
    this._bluetooth.isBluetoothEnabled().then(result => {
      console.log('**** isBluetoothEnabled result ****', result);
      // Brad - adding isIOS check bc the CBManager may not return the `ON` state
      // when this executes so we'll try to advertise anyway
      if (isIOS || result === true) {
        this.advertise().catch(err => {
          const msg = `bluetooth.service::advertise error: ${err}`;
          console.log('error msg', msg);
          alert({
            title: this._translateService.instant('bluetooth.service-failure'),
            okButtonText: this._translateService.instant('dialogs.ok'),
            message: msg
          });
        });
      } else {
        // only Android can enable bluetooth, iOS requires the user to do on the device
        if (isAndroid) {
          this._bluetooth.enable().catch(error => {
            this._loggingService.logException(error);
          });
        } else {
          alert({
            message: this._translateService.instant(
              'bluetooth.enable-bluetooth'
            ),
            okButtonText: this._translateService.instant('dialogs.ok')
          });
        }
      }
    });

    this.setEventListeners();
  }

  public setEventListeners() {
    this.clearEventListeners();
    // setup event listeners
    this._bluetooth.on(
      Bluetooth.bond_status_change_event,
      this.onBondStatusChange,
      this
    );
    this._bluetooth.on(
      Bluetooth.peripheral_connected_event,
      this.onPeripheralConnected,
      this
    );
    this._bluetooth.on(
      Bluetooth.peripheral_disconnected_event,
      this.onPeripheralDisconnected,
      this
    );
    this._bluetooth.on(
      Bluetooth.device_discovered_event,
      this.onDeviceDiscovered,
      this
    );
    this._bluetooth.on(
      Bluetooth.device_name_change_event,
      this.onDeviceNameChange,
      this
    );
    this._bluetooth.on(
      Bluetooth.device_uuid_change_event,
      this.onDeviceUuidChange,
      this
    );
    this._bluetooth.on(
      Bluetooth.device_acl_disconnected_event,
      this.onDeviceAclDisconnected,
      this
    );

    /*
    this._bluetooth.on(Bluetooth.centralmanager_updated_state_event, args => {
      console.log('centralmanager_updated_state_event');
    });
      */

    this._bluetooth.on(
      Bluetooth.server_connection_state_changed_event,
      this.onServerConnectionStateChanged,
      this
    );
    this._bluetooth.on(
      Bluetooth.characteristic_write_request_event,
      this.onCharacteristicWriteRequest,
      this
    );
    this._bluetooth.on(
      Bluetooth.characteristic_read_request_event,
      this.onCharacteristicReadRequest,
      this
    );
    this._bluetooth.on(
      Bluetooth.bluetooth_advertise_failure_event,
      this.onAdvertiseFailure,
      this
    );
    this._bluetooth.on(
      Bluetooth.bluetooth_advertise_success_event,
      this.onAdvertiseSuccess,
      this
    );
  }

  public clearEventListeners() {
    // setup event listeners
    this._bluetooth.off(Bluetooth.bond_status_change_event);
    this._bluetooth.off(Bluetooth.peripheral_connected_event);
    this._bluetooth.off(Bluetooth.peripheral_disconnected_event);
    this._bluetooth.off(Bluetooth.device_discovered_event);
    this._bluetooth.off(Bluetooth.device_name_change_event);
    this._bluetooth.off(Bluetooth.device_uuid_change_event);
    this._bluetooth.off(Bluetooth.device_acl_disconnected_event);
    this._bluetooth.off(Bluetooth.server_connection_state_changed_event);
    this._bluetooth.off(Bluetooth.characteristic_write_request_event);
    this._bluetooth.off(Bluetooth.characteristic_read_request_event);
    this._bluetooth.off(Bluetooth.bluetooth_advertise_failure_event);
    this._bluetooth.off(Bluetooth.bluetooth_advertise_success_event);
  }

  public clearSmartDrives() {
    let connectedSDs = BluetoothService.SmartDrives.slice().filter(
      sd => sd.connected
    );
    BluetoothService.SmartDrives.splice(
      0,
      BluetoothService.SmartDrives.length,
      ...connectedSDs
    );
  }

  public clearPushTrackers() {
    BluetoothService.PushTrackers.splice(
      0,
      BluetoothService.PushTrackers.length
    );
  }

  /**
   * Check if bluetooth is enabled.
   */
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

    const x = await this._bluetooth
      .requestCoarseLocationPermission()
      .catch(error => {
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

    await this._bluetooth.startAdvertising({
      UUID: BluetoothService.AppServiceUUID,
      settings: {
        connectable: true
      },
      data: {
        includeDeviceName: true
      }
    });

    this._bluetooth.addService(this.AppService);

    return Promise.resolve();

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

  public write(opts: any) {
    return this._bluetooth.write(opts);
  }

  public async stop(): Promise<any> {
    this.enabled = false;
    this.initialized = false;
    // remove the services
    this.deleteServices();
    // stop the gatt server
    this._bluetooth.stopGattServer(); // TODO: android only for now
    // stop listening for events
    this.clearEventListeners();
    // disconnect
    //await this.disconnectAll(); // TODO: doesn't work right now
    // stop advertising
    this._bluetooth.stopAdvertising();
    return Promise.resolve();
  }

  public restart(): Promise<any> {
    return this.stop()
      .then(() => {
        return this.advertise();
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
    const argdata = args.data;
    const dev = argdata.device as Central;
    const bondState = argdata.bondState;
    console.log(`${dev.address} - bond state - ${bondState}`);
    switch (bondState) {
      case BondState.bonding:
        if (isAndroid) {
          dev.device.fetchUuidsWithSdp();
        }
        break;
      case BondState.bonded:
        if (isAndroid) {
          this._bluetooth.removeBond(dev.device);
        }
        const pt = this.getOrMakePushTracker(dev);
        pt.handlePaired();
        this.updatePushTrackerState();
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
    //console.log('device discovered!');
    const argdata = args.data;
    const peripheral = {
      rssi: argdata.RSSI,
      device: argdata.device,
      address: argdata.UUID,
      name: argdata.name
    };
    console.log(`${peripheral.name}::${peripheral.address} - discovered`);
    if (this.isSmartDrive(peripheral)) {
      const sd = this.getOrMakeSmartDrive(peripheral);
    }
  }

  private onDeviceNameChange(args: any): void {
    //console.log(`name change!`);
    const argdata = args.data;
    const dev = argdata.device;
    const name = argdata.name;
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
    const argdata = args.data;
    const device = argdata.device;
    console.log(`${device.name}::${device.address} - disconnected`);
    if (this.isSmartDrive(device)) {
      const sd = this.getOrMakeSmartDrive(device);
      sd.handleDisconnect();
    } else if (this.isPushTracker(device)) {
      const pt = this.getOrMakePushTracker(device);
      pt.handleDisconnect();
      this.updatePushTrackerState();
    }
    //console.log('finished acl disconnect');
  }

  private onServerConnectionStateChanged(args: any): void {
    //console.log(`server connection state change`);
    const argdata = args.data;
    const connection_state = argdata.connection_state;
    const device = argdata.device;
    console.log(
      `state change - ${device.name}::${device.address} - ${connection_state}`
    );
    switch (connection_state) {
      case ConnectionState.connected:
        // NOTE : need to figure out the iOS piece for this
        // since this is android method for the device - could
        // be something we move into the bluetooth layer

        // TODO: move this into the bluetooth layer!
        if (isAndroid) {
          device.device.fetchUuidsWithSdp();
        }

        // TODO: use BluetoothGatt to get the service (by UUID 1800)

        // TODO: use the returned service to get the characteristic
        //       (by UUID 2a00)

        // TODO: use the returned characteristic to call
        //       'getStringValue()' to read the characteristic to get
        //       the name
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device);
          pt.handleConnect();
          this.updatePushTrackerState();
          this.notify(
            `${device.name || 'PushTracker'}::${device.address} connected`
          );
        } else if (this.isSmartDrive(device)) {
          const sd = this.getOrMakeSmartDrive(device);
          sd.handleConnect();
        }
        break;
      case ConnectionState.disconnected:
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device);
          pt.handleDisconnect();
          this.updatePushTrackerState();
          this.notify(
            `${device.name || 'PushTracker'}::${device.address} disconnected`
          );
        } else if (this.isSmartDrive(device)) {
          const sd = this.getOrMakeSmartDrive(device);
          sd.handleDisconnect();
        }
        break;
      default:
        break;
    }
    //console.log(`finished server connection state change!`);
  }

  private onPeripheralConnected(args: any): void {
    //console.log('peripheral connected!');
    const argdata = args.data;
    const device = {
      rssi: argdata.RSSI,
      device: argdata.device,
      address: argdata.UUID,
      name: argdata.name
    };
    console.log(`peripheral connected - ${device.name}::${device.address}`);
    if (device.address && this.isSmartDrive(device)) {
      const sd = this.getOrMakeSmartDrive(device);
      //sd.handleConnect();
    }
    // TODO: this event is not emitted by the android part of the bluetooth library
    //console.log('finished peripheral connected!');
  }

  private onPeripheralDisconnected(args: any): void {
    //console.log('peripheral disconnected!');
    const argdata = args.data;
    const device = {
      rssi: argdata.RSSI,
      device: argdata.device,
      address: argdata.UUID,
      name: argdata.name
    };
    console.log(`peripheral disconnected - ${device.name}::${device.address}`);
    if (device.address && this.isSmartDrive(device)) {
      const sd = this.getOrMakeSmartDrive(device);
      sd.handleDisconnect();
    }
    // TODO: this event is not emitted by the android part of the bluetooth library
    //console.log('finished peripheral disconnected!');
  }

  private onCharacteristicWriteRequest(args: any): void {
    //console.log(`Got characteristic write request!`);
    const argdata = args.data;
    const value = argdata.value;
    const device = argdata.device;
    let data = null;
    if (isIOS) {
      const tmp = new ArrayBuffer(Packet.maxSize);
      value.getBytes(tmp);
      data = new Uint8Array(tmp);
    } else {
      data = new Uint8Array(value);
    }
    const p = new Packet();
    p.initialize(data);

    if (this.isPushTracker(device)) {
      const pt = this.getOrMakePushTracker(device);
      pt.handlePacket(p);
      this.updatePushTrackerState();
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
        console.log(
          `Bluetooth already offers ${BluetoothService.AppServiceUUID}`
        );
        return;
      }
      console.log('making service');

      // make the service
      this.AppService = this._bluetooth.makeService({
        UUID: BluetoothService.AppServiceUUID,
        primary: true
      });

      const descriptorUUIDs = ['2900', '2902'];

      // make the characteristics
      const characteristics = PushTracker.Characteristics.map(cuuid => {
        //console.log('Making characteristic: ' + cuuid);
        //  defaults props are set READ/WRITE/NOTIFY, perms are set to READ/WRITE
        const c = this._bluetooth.makeCharacteristic({
          UUID: cuuid
        });

        if (isAndroid) {
          //console.log('making descriptors');
          const descriptors = descriptorUUIDs.map(duuid => {
            //  defaults perms are set to READ/WRITE
            const d = this._bluetooth.makeDescriptor({
              UUID: duuid
            });

            d.setValue(new Array([0x00, 0x00]));
            //console.log('Making descriptor: ' + duuid);
            return d;
          });

          descriptors.map(d => {
            c.addDescriptor(d);
          });
        } else {
          // TODO: don't need ios impl apparrently?
        }

        if (isAndroid) {
          c.setValue(
            0,
            (android.bluetooth as any).BluetoothGattCharacteristic.FORMAT_UINT8,
            0
          );
          c.setWriteType(
            (android.bluetooth as any).BluetoothGattCharacteristic
              .WRITE_TYPE_DEFAULT
          );
        } else {
          // TODO: don't need ios impl apparrently?
        }

        // store the characteristic here
        if (cuuid === PushTracker.DataCharacteristicUUID) {
          PushTracker.DataCharacteristic = c;
        }

        return c;
      });
      console.log('Adding characteristics to service!');
      if (isAndroid) {
        characteristics.map(c => this.AppService.addCharacteristic(c));
      } else {
        this.AppService.characteristics = characteristics;
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  private _mergePushTrackerState(s1, s2): PushTrackerState {
    if (s1 == PushTrackerState.ready || s2 == PushTrackerState.ready) {
      return PushTrackerState.ready;
    } else if (
      s1 == PushTrackerState.connected ||
      s2 == PushTrackerState.connected
    ) {
      return PushTrackerState.connected;
    } else if (
      s1 == PushTrackerState.disconnected ||
      s2 == PushTrackerState.disconnected
    ) {
      return PushTrackerState.disconnected;
    } else if (s1 == PushTrackerState.paired || s2 == PushTrackerState.paired) {
      return PushTrackerState.paired;
    } else {
      return PushTrackerState.unknown;
    }
  }

  private updatePushTrackerState(): void {
    let state = BluetoothService.PushTrackers.reduce((state, pt) => {
      if (pt && pt.connected) {
        if (pt.version !== 0xff) {
          state = this._mergePushTrackerState(state, PushTrackerState.ready);
        } else {
          state = this._mergePushTrackerState(
            state,
            PushTrackerState.connected
          );
        }
      } else if (pt && pt.paired) {
        state = this._mergePushTrackerState(
          state,
          PushTrackerState.disconnected
        );

        // setting true to know the APP has previously paired to PT
        BluetoothService.hasPairedToPushtrackerPreviously = true;
      } else if (pt) {
        state = this._mergePushTrackerState(state, PushTrackerState.unknown);
      } else {
        state = this._mergePushTrackerState(state, PushTrackerState.unknown);
      }
      return state;
    }, PushTrackerState.unknown);

    BluetoothService.pushTrackerStatus.set('state', state);
  }

  private getOrMakePushTracker(device: any): PushTracker {
    let pt = BluetoothService.PushTrackers.filter(
      p => p.address === device.address
    )[0];
    //console.log(`Found PT: ${pt}`);
    if (pt === null || pt === undefined) {
      pt = new PushTracker(this, { address: device.address });
      BluetoothService.PushTrackers.push(pt);
    }
    if (device.device) {
      pt.device = device.device;
    }
    //console.log(`Found or made PT: ${pt}`);
    return pt;
  }

  private getOrMakeSmartDrive(device: any): SmartDrive {
    let sd = BluetoothService.SmartDrives.filter(
      (x: SmartDrive) => x.address === device.address
    )[0];
    //console.log(`Found SD: ${sd}`);
    if (sd === null || sd === undefined) {
      sd = new SmartDrive(this, { address: device.address });
      BluetoothService.SmartDrives.push(sd);
    }
    //console.log(`Found or made SD: ${sd}`);
    if (device.device) {
      sd.device = device.device;
    }
    if (device.rssi) {
      sd.rssi = device.rssi;
    }
    return sd;
  }

  public disconnectPushTrackers(addresses: string[]) {
    addresses.map(addr => {
      this._bluetooth.cancelServerConnection(addr);
    });
  }

  public sendToPushTrackers(data: any, devices?: any): Promise<any> {
    let d = data;
    if (isIOS) {
      d = NSData.dataWithData(data);
      //console.log(`Sending to Pushtracker: ${d}`);
    } else if (isAndroid) {
      const length = data.length || (data.size && data.size());
      const arr = Array.create('byte', length);
      for (let i = 0; i < length; i++) {
        arr[i] = data[i];
      }
      d = arr;
    }
    return this._bluetooth.notifyCentrals(
      d,
      PushTracker.DataCharacteristic,
      devices
    );
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
    const hasUUID =
      uuid && uuid.toUpperCase() === SmartDrive.ServiceUUID.toUpperCase();
    const isSD = (name && name.includes('Smart Drive DU')) || hasUUID;
    //console.log(`isSD: ${isSD}`);
    return isSD;
  }

  private isPushTracker(dev: any): boolean {
    console.log('isPushTracker device: ' + JSON.stringify(dev));
    const UUIDs = (dev && dev.UUIDs) || [];
    const name = dev && dev.name;
    // console.log(`isPushTracker - uuids: ${UUIDs}, name: ${name}`);
    const hasUUID = UUIDs.reduce(
      (a, e) => a || e.toUpperCase() === PushTracker.ServiceUUID.toUpperCase(),
      false
    );
    const isPT =
      (name && name.includes('PushTracker')) ||
      (name && name.includes('Bluegiga')) ||
      hasUUID;
    // console.log(`isPT: ${isPT}`);
    return isPT;
  }

  private notify(text: string): void {
    try {
      this.snackbar.simple(text).catch(err => {
        console.log('snackbar promise rejection:', err);
      });
    } catch (ex) {
      console.log('snackbar exception:', ex);
    }
  }
}
