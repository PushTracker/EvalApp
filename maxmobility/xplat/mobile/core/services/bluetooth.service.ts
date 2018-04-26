// angular
import { Injectable } from '@angular/core';

// nativescript
import * as dialogsModule from 'tns-core-modules/ui/dialogs';
import { fromObject } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

// libs
import * as Toast from 'nativescript-toast';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { Bluetooth } from 'nativescript-bluetooth';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';

@Injectable()
export class BluetoothService {
  // static members
  public static SmartDriveServiceUUID = '0cd51666-e7cb-469b-8e4d-2742f1ba7723';
  public static PushTrackerServiceUUID = '1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0';
  public static AppServiceUUID = '9358ac8f-6343-4a31-b4e0-4b13a2b45d86';

  public static PushTrackers = new ObservableArray<PushTracker>();
  public static SmartDrives = new ObservableArray<SmartDrive>();

  // public members
  public enabled = false;

  // private members
  private _initialized = false;
  private _bluetooth = new Bluetooth();
  private PushTrackerDataCharacteristic: any = null;
  private AppService: any = null;
  private snackbar = new SnackBar();
  private feedback = new Feedback();

  // public functions
  constructor() {
    // enabling `debug` will output console.logs from the bluetooth source code
    this._bluetooth.debug = true;

    this._bluetooth.on(Bluetooth.bond_status_change_event, this.onBondStatusChange.bind(this));
    this._bluetooth.on(Bluetooth.peripheral_connected_event, this.onPeripheralConnected.bind(this));
    this._bluetooth.on(Bluetooth.device_discovered_event, this.onDeviceDiscovered.bind(this));
    this._bluetooth.on(Bluetooth.device_name_change_event, this.onDeviceNameChange.bind(this));
    this._bluetooth.on(Bluetooth.device_uuid_change_event, this.onDeviceUuidChange.bind(this));
    this._bluetooth.on(Bluetooth.device_acl_disconnected_event, this.onDeviceAclDisconnected.bind(this));

    this._bluetooth.on(Bluetooth.server_connection_state_changed_event, this.onServerConnectionStateChanged.bind(this));
    this._bluetooth.on(Bluetooth.characteristic_write_request_event, this.onCharacteristicWriteRequest.bind(this));

    // setup event listeners
    this._bluetooth.on(Bluetooth.bluetooth_advertise_failure_event, args => {
      console.log(Bluetooth.bluetooth_advertise_failure_event, args);
    });

    this.advertise();
  }

  public clearSmartDrives(): void {
    BluetoothService.SmartDrives.splice(0, BluetoothService.SmartDrives.length);
  }

  public clearPushTrackers(): void {
    BluetoothService.PushTrackers.splice(0, BluetoothService.PushTrackers.length);
  }

  public async initialize() {
    return this._bluetooth
      .requestCoarseLocationPermission()
      .then(() => {
        return this._bluetooth
          .enable()
          .then(wasEnabled => {
            this.enabled = wasEnabled;
            console.log(`BLUETOOTH WAS ENABLED? ${this.enabled}`);
            if (this.enabled === true) {
              this._bluetooth.startGattServer();
              if (!this._bluetooth.offersService(BluetoothService.AppServiceUUID)) {
                this.addServices();
              }
              this._initialized = true;
            } else {
              console.log('Bluetooth is not enabled.');
            }
          })
          .catch(err => {
            console.log('enable err', err);
          });
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
    return this.scan([BluetoothService.SmartDriveServiceUUID], timeout);
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

  public connect(address: string, onConnected?: Function, onDisconnected?: Function) {
    this._bluetooth.connect({
      UUID: address,
      onConnected: onConnected,
      onDisconnected: onDisconnected
    });
  }

  public restart(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._bluetooth.disable();
      setTimeout(() => {
        this._bluetooth.enable().then(enabled => {
          resolve();
        });
      }, 250);
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
      var address = peripheral.UUID;
      var sd = this.getOrMakeSmartDrive(address);
      console.log(`SmartDrives: ${BluetoothService.SmartDrives.length} : ${BluetoothService.SmartDrives}`);
    }
  }

  private onDeviceNameChange(args: any): void {
    const dev = args.data.device;
    const name = args.data.name;
    console.log(`${dev} - name change - ${name || 'None'}`);
  }

  private onDeviceUuidChange(args: any): void {
    const dev = args.data.device;
    const uuid = args.data.uuid;
    console.log(`${dev} - uuid change - ${uuid || 'None'}`);
  }

  private onDeviceAclDisconnected(args: any): void {
    console.log(`${args.data.device} acl disconnected!`);
  }

  private onServerConnectionStateChanged(args: any): void {
    const newState = args.data.newState;
    const device = args.data.device;
    switch (newState) {
      case android.bluetooth.BluetoothProfile.STATE_CONNECTED:
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device.getAddress());
          pt.handleConnect();
          this.notify(`${device.getName()}::${device} connected`);
        }
        //Toast.makeText(`${device.getName()}::${device} connected`).show();
        break;
      case android.bluetooth.BluetoothProfile.STATE_CONNECTING:
        break;
      case android.bluetooth.BluetoothProfile.STATE_DISCONNECTED:
        if (this.isPushTracker(device)) {
          const pt = this.getOrMakePushTracker(device.getAddress());
          pt.handleDisconnect();
          this.notify(`${device.getName()}::${device} disconnected`);
        }
        //Toast.makeText(`${device.getName()}::${device} disconnected`).show();
        break;
      case android.bluetooth.BluetoothProfile.STATE_DISCONNECTING:
        break;
      default:
        break;
    }
  }

  private onPeripheralConnected(args: any): void {
    const peripheral = args.data.device;
    // TODO: this event is not emitted by the bluetooth library
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

    /*
	  if (p.Type() === 'Data' && p.SubType() === 'DailyInfo') {
	  const di = new DailyInfo();
	  di.fromPacket(p);
	  console.log(JSON.stringify(di.data()));
	  // TODO: SAVE THE DATA WE RECEIVE INTO OUR LOCAL STORAGE
	  //DataStorage.HistoricalData.update(di);
	  // TODO: UPDATE THE SERVER WITH OUR DAILY INFO (FOR PUSHTRACKER APP)

	  // TODO: THIS DATA SHOULD BE AVAILABLE DURING THE TRIAL PAGES WHEN STARTING AND STOPPING A TRIAL
	  //       - we need events for when we receive daily info from devices that the pages can listen to

	  let options = {
	  actionText: 'View',
	  snackText: `${device.getName()}::${device} sent DailyInfo`,
	  hideDelay: 1000
	  };
	  this.snackbar.action(options).then(args => {
	  if (args.command === 'Action') {
	  dialogsModule.alert({
	  title: `${device} Daily Info`,
	  message: JSON.stringify(di.data(), null, 2),
	  okButtonText: 'Ok'
	  });
	  }
	  });
	  } else {
	  console.log(`${p.Type()}::${p.SubType()} ${p.toString()}`);
	  }
	*/
    console.log(`${p.Type()}::${p.SubType()} ${p.toString()}`);
    p.destroy();
  }

  private onCharacteristicReadRequest(args: any): void {}

  // service controls
  private deleteServices(): void {
    try {
      this._bluetooth.clearServices();
    } catch (ex) {
      console.log(ex);
    }
  }

  private addServices(): void {
    try {
      console.log('deleting any existing services');
      this.deleteServices();
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
      const charUUIDs = [
        '58daaa15-f2b2-4cd9-b827-5807b267dae1',
        '68208ebf-f655-4a2d-98f4-20d7d860c471',
        '9272e309-cd33-4d83-a959-b54cc7a54d1f',
        '8489625f-6c73-4fc0-8bcc-735bb173a920',
        '5177fda8-1003-4254-aeb9-7f9edb3cc9cf'
      ];
      const ptDataChar = charUUIDs[1];
      charUUIDs.map(cuuid => {
        console.log('Making characteristic: ' + cuuid);
        const c = this._bluetooth.makeCharacteristic({
          UUID: cuuid,
          gattProperty:
            android.bluetooth.BluetoothGattCharacteristic.PROPERTY_READ |
            android.bluetooth.BluetoothGattCharacteristic.PROPERTY_WRITE |
            android.bluetooth.BluetoothGattCharacteristic.PROPERTY_NOTIFY,
          gattPermissions:
            android.bluetooth.BluetoothGattCharacteristic.PERMISSION_WRITE |
            android.bluetooth.BluetoothGattCharacteristic.PERMISSION_READ
        });
        console.log('making descriptors');
        const descriptors = descriptorUUIDs.map(duuid => {
          const d = this._bluetooth.makeDescriptor({
            UUID: duuid,
            permissions:
              android.bluetooth.BluetoothGattDescriptor.PERMISSION_READ |
              android.bluetooth.BluetoothGattDescriptor.PERMISSION_WRITE
          });
          d.setValue(new Array([0x00, 0x00]));
          console.log('Making descriptor: ' + duuid);
          return d;
        });
        descriptors.map(d => {
          c.addDescriptor(d);
        });
        c.setValue(0, android.bluetooth.BluetoothGattCharacteristic.FORMAT_UINT8, 0);
        c.setWriteType(android.bluetooth.BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
        /*
		  if (cuuid === ptDataChar) {
		  pushTrackerDataCharacteristic = c;
		  }
		*/
        console.log('Adding characteristic to service!');
        this.AppService.addCharacteristic(c);
      });
    } catch (ex) {
      console.log(ex);
    }
  }

  private getOrMakePushTracker(address: string): PushTracker {
    let pt = BluetoothService.PushTrackers.filter(p => p.address == address)[0];
    console.log(`Found PT: ${pt}`);
    if (pt === null || pt === undefined) {
      pt = new PushTracker({ address });
      BluetoothService.PushTrackers.push(pt);
    }
    console.log(`Found or made PT: ${pt}`);
    return pt;
  }

  private getOrMakeSmartDrive(address: string): SmartDrive {
    let sd = BluetoothService.SmartDrives.filter(sd => sd.address == address)[0];
    console.log(`Found SD: ${sd}`);
    if (sd === null || sd === undefined) {
      sd = new SmartDrive({ address });
      BluetoothService.SmartDrives.push(sd);
    }
    console.log(`Found or made SD: ${sd}`);
    return sd;
  }

  public getPushTracker(address: string) {
    return BluetoothService.PushTrackers.filter(p => p.address === address)[0];
  }

  public getSmartDrive(address: string) {
    return BluetoothService.SmartDrives.filter(sd => sd.address === address)[0];
  }

  private isSmartDrive(dev: any): boolean {
    var name = dev && dev.name;
    return name && name.includes('Smart Drive DU'); // || dev.UUID === BluetoothService.SmartDriveServiceUUID;
  }

  private isPushTracker(dev: any): boolean {
    var UUIDs = dev && dev.getUuids && dev.getUuids();
    var name = dev && dev.getName && dev.getName();
    return (
      (name && name.includes('PushTracker')) || (UUIDs && UUIDs.indexOf(BluetoothService.PushTrackerServiceUUID) > -1)
    );
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
