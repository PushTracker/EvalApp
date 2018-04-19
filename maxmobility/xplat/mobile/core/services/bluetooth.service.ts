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
import { Packet, DailyInfo } from '@maxmobility/core';

@Injectable()
export class BluetoothService {
  // static members
  public static SmartDriveServiceUUID = '0cd51666-e7cb-469b-8e4d-2742f1ba7723';
  public static PushTrackerServiceUUID = '1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0';
  public static AppServiceUUID = '9358ac8f-6343-4a31-b4e0-4b13a2b45d86';
  public static peripherals = new ObservableArray<any>();

  // public members

  // private members
  private _bluetooth = new Bluetooth();
  private PushTrackerDataCharacteristic: any = null;
  private AppService: any = null;
  private snackbar = new SnackBar();
  private feedback = new Feedback();

  // public functions
  constructor() {
    // enabling `debug` will output console.logs from the bluetooth source code
    this._bluetooth.debug = true;

    // setup event listeners
    this._bluetooth.on(Bluetooth.bluetooth_advertise_failure_event, args => {
      console.log(Bluetooth.bluetooth_advertise_failure_event, args);
    });
  }

  public advertise() {
    // return this._bluetooth
    //   .requestCoarseLocationPermission()
    //   .then(() => {
    //     return this._bluetooth.enable();
    //   })
    //   .then(wasEnabled => {
    //     console.log(`BLUETOOTH WAS ENABLED? ${wasEnabled}`);
    //     return this._bluetooth.startAdvertising({ UUID: BluetoothService.AppServiceUUID });
    //   });

    return this._bluetooth
      .requestCoarseLocationPermission()
      .then(() => {
        return this._bluetooth
          .enable()
          .then(wasEnabled => {
            console.log(`BLUETOOTH WAS ENABLED? ${wasEnabled}`);
            if (wasEnabled === true) {
              this._bluetooth.startGattServer();
              if (!this._bluetooth.offersService(BluetoothService.AppServiceUUID)) {
                this.addServices();
              }
              return this._bluetooth
                .startAdvertising({
                  UUID: BluetoothService.AppServiceUUID,
                  settings: {
                    connectable: true
                  },
                  data: {
                    includeDeviceName: true
                  }
                })
                .then(() => {
                  this._bluetooth.addService(this.AppService);
                  console.log('Advertising Started!');
                });
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

  public scanForAny(onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
    return this.scan([], onDiscoveredCallback, timeout);
  }

  public scanForSmartDrive(onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
    return this.scan([BluetoothService.SmartDriveServiceUUID], onDiscoveredCallback, timeout);
  }

  // returns a promise that resolves when scanning completes
  public scan(uuids: string[], onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
    // clear peripherals
    this.clearPeripherals();

    return this._bluetooth.startScanning({
      serviceUUIDs: uuids,
      seconds: timeout,
      onDiscovered: peripheral => {
        BluetoothService.peripherals.push(fromObject(peripheral));
        if (onDiscoveredCallback && typeof onDiscoveredCallback === 'function') {
          onDiscoveredCallback(peripheral);
        }
      }
    });
  }

  public stopScanning(): Promise<any> {
    return this._bluetooth.stopScanning();
  }

  public clearPeripherals(): void {
    BluetoothService.peripherals.splice(0, BluetoothService.peripherals.length);
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
  private addServices(): void {
    try {
      //console.log("deleting any existing services");
      //deleteServices();
      console.log('making service');

      this.AppService = this._this._bluetooth.makeService({
        UUID: '9358ac8f-6343-4a31-b4e0-4b13a2b45d86'
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
          UUID: cuuid
        });
        console.log('making descriptors');
        const descriptors = descriptorUUIDs.map(duuid => {
          const d = this._bluetooth.makeDescriptor({
            UUID: duuid
          });
          d.setValue(new Array([0x00, 0x00]));
          console.log('Making descriptor: ' + duuid);
          return d;
        });
        descriptors.map(d => {
          c.addDescriptor(d);
        });
        /*
		c.setValue(0, android.bluetooth.BluetoothGattCharacteristic.FORMAT_UINT8, 0);
		c.setWriteType(android.bluetooth.BluetoothGattCharacteristic.WRTIE_TYPE_DEFAULT);
		if (cuuid === ptDataChar) {
		    pushTrackerDataCharacteristic = c;
		}
		*/
        this.AppService.addCharacteristic(c);
      });
    } catch (ex) {
      console.log(ex);
    }
  }

  private isSmartDrive(dev: any): boolean {
    return dev.getName() === 'SmartDrive DU' || dev.getUuids().indexOf(BluetoothService.SmartDriveServiceUUID) > -1;
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
