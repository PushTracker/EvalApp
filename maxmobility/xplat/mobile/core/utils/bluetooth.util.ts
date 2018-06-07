import { Injectable } from '@angular/core';
import { fromObject } from 'data/observable';
import { ObservableArray } from 'data/observable-array';

import * as dialogsModule from 'ui/dialogs';

import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { Bluetooth } from 'nativescript-bluetooth';
import * as Toast from 'nativescript-toast';

import { Packet, DailyInfo } from '@maxmobility/core';
//import { DailyInfo } from "./daily-info";
//const Packet = require("./packet/packet");

@Injectable()
export class BluetoothService {
  // static members
  public static SmartDriveServiceUUID: string = '0cd51666-e7cb-469b-8e4d-2742f1ba7723';
  public static PushTrackerServiceUUID: string = '1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0';
  public static AppServiceUUID: string = '9358ac8f-6343-4a31-b4e0-4b13a2b45d86';
  public static peripherals: ObservableArray<any> = new ObservableArray();

  // public members

  // private members
  private _bluetooth = new Bluetooth();

  private PushTrackerDataCharacteristic: any = null;
  private AppService: any = null;

  private snackbar: SnackBar = new SnackBar();
  private feedback: Feedback = new Feedback();

  // public functions
  constructor() {}

  public advertise() {
    return this._bluetooth.startAdvertising({ UUID: BluetoothService.AppServiceUUID });
  }

  public scanForAny(onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
    return this.scan([], onDiscoveredCallback, timeout);
  }

  public scanForSmartDrive(onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
    return this.scan([BluetoothService.SmartDriveServiceUUID], onDiscoveredCallback, timeout);
  }

  // returns a promise that resolves when scanning completes
  public scan(uuids: Array<string>, onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
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
