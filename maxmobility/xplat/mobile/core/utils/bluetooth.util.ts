import { fromObject } from "data/observable";
import { ObservableArray } from "data/observable-array";

import * as dialogsModule from "ui/dialogs";

import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { Feedback, FeedbackType, FeedbackPosition } from "nativescript-feedback";
import * as bluetooth from "nativescript-bluetooth";
import * as Toast from "nativescript-toast";

import { Packet, DailyInfo } from '@maxmobility/core';
//import { DailyInfo } from "./daily-info";
//const Packet = require("./packet/packet");

export class Bluetooth {
    // static members
    public static SmartDriveServiceUUID: string = "0cd51666-e7cb-469b-8e4d-2742f1ba7723";
    public static PushTrackerServiceUUID: string = "1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0";
    public static peripherals: ObservableArray<any> = new ObservableArray();

    // public members

    // private members
    private PushTrackerDataCharacteristic: any = null;
    private AppService: any = null;

    private snackbar: SnackBar = new SnackBar();
    private feedback: Feedback = new Feedback();

    // public functions
    public scanForAny(onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
	return this.scan([], onDiscoveredCallback, timeout);
    }

    public scanForSmartDrive(onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
	return this.scan([Bluetooth.SmartDriveServiceUUID], onDiscoveredCallback, timeout);
    }
    
    // returns a promise that resolves when scanning completes
    public scan(uuids: Array<string>, onDiscoveredCallback: Function, timeout: number = 4): Promise<any> {
	// clear peripherals
	this.clearPeripherals();

	return bluetooth.startScanning({
	    serviceUUIDs: uuids,
	    seconds: timeout,
	    onDiscovered: (peripheral) => {
		Bluetooth.peripherals.push(fromObject(peripheral));
		if (onDiscoveredCallback && typeof onDiscoveredCallback === "function") {
                    onDiscoveredCallback(peripheral);
		}
	    }
	});
    }

    public stopScanning(): Promise<any> {
	return bluetooth.stopScanning();
    }

    public clearPeripherals(): void {
	Bluetooth.peripherals.splice(0, Bluetooth.peripherals.length);
    }

    public restart(): Promise<any> {
	return new Promise((resolve, reject) => {
	    bluetooth.disable();
	    setTimeout(() => {
		bluetooth.enable().then((enabled) => {
		    resolve();
		});
	    }, 250);
	});
    }

    // private functions
    private isSmartDrive(dev: any): boolean {
	return dev.getName() === "SmartDrive DU" ||
	    dev.getUuids().indexOf(Bluetooth.SmartDriveServiceUUID) > -1;
    }

    private notify(text: string): void {
	this.snackbar.simple(text);
    }

    private selectDialog(options: any): Promise<any> {
	// options should be of form....
	return new Promise((resolve, reject) => {
            dialogsModule.action({
		message: options.message || "Select",
		cancelButtonText: options.cancelButtonText || "Cancel",
		actions: options.actions || []
            })
		.then((result) => {
		    resolve(result !== "Cancel" ? result : null);
		})
		.catch((err) => {
		    reject(err);
		});
	});
    }
}
