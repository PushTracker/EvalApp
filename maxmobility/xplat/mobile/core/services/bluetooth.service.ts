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
  constructor() {}

  public advertise() {
    if (this._bluetooth.isBluetoothEnabled()) {
      return this._bluetooth.startAdvertising({ UUID: BluetoothService.AppServiceUUID });
    } else {
      return this._bluetooth
        .requestCoarseLocationPermission()
        .then(() => {
          this._bluetooth.enable();
        })
        .then(() => {
          this._bluetooth.startAdvertising({ UUID: BluetoothService.AppServiceUUID });
        });
    }
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
