import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { Observable } from "data/observable";
import { confirm } from "ui/dialogs";

import { EvaluationService } from "../shared/evaluation.service";

import { knownFolders, File } from "file-system";

import { registerElement } from "nativescript-angular/element-registry";
registerElement("VideoPlayer", () => require("nativescript-videoplayer").Video);

let currentApp = knownFolders.currentApp();

@Component({
    selector: "EvalEntry",
    moduleId: module.id,
    templateUrl: "./evalEntry.component.html",
    styleUrls: ["./evalEntry.component.css"]
})
export class EvalEntryComponent implements OnInit {
    /* ***********************************************************
    * Use the @ViewChild decorator to get a reference to the drawer component.
    * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
    *************************************************************/
    @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;

    public yesNo: Array<SegmentedBarItem> = [];
    public PushingPain: Array<SegmentedBarItem> = [];
    public PushingFatigue: Array<SegmentedBarItem> = [];

    public isIOS: boolean = false;
    public isAndroid: boolean = false;
    
    // private members
    private _sideDrawerTransition: DrawerTransitionBase;
    private pains = [ "None", "Low", "Medium", "High" ];
    private fatigues = [ "None", "Low", "Medium", "High" ];

    constructor() {
	this.pains.map((o) => {
	    const item = new SegmentedBarItem();
	    item.title = o;
	    this.PushingPain.push(item);
	});
	this.fatigues.map((o) => {
	    const item = new SegmentedBarItem();
	    item.title = o;
	    this.PushingFatigue.push(item);
	});
    }

    public onOTACheck(): void {
	confirm({
	    title: "Check for Firmware Updates?",
	    message: "Would you like to see if there are newer firmwares for the PushTracker, SmartDrive Microcontroller, and SmartDrive Bluetooth?",
	    okButtonText: "Yes",
	    cancelButtonText: "No"
	})
	    .then((result) => {
		if (result) {
		    return this.performSmartDriveOTA()
			.then(() => {
			    this.performSmartDriveBluetoothOTA();
			})
			.then(() => {
			    this.performPushTrackerOTA();
			});
		}
	    })
	    .catch((err) => {
		console.log(err);
	    });
    }

    public onSliderUpdate(key, args) {
	this.settings.set(key, args.object.value);
    }

    // pushing pain
    public getPushingPainIndex(): number {
	return this.pains.indexOf(this.settings.get("PushingPain"));
    }

    public onPushingPainIndexChange(args): void {
	let segmentedBar = <SegmentedBar>args.object;
	this.settings.set("PushingPain", this.pains[segmentedBar.selectedIndex]);
    }

    // pushing fatigue
    public getPushingFatigueIndex(): number {
	return this.fatigues.indexOf(this.settings.get("PushingFatigue"));
    }

    public onPushingFatigueIndexChange(args): void {
	let segmentedBar = <SegmentedBar>args.object;
	this.settings.set("PushingFatigue", this.fatigues[segmentedBar.selectedIndex]);
    }

    /* ***********************************************************
    * Use the sideDrawerTransition property to change the open/close animation of the drawer.
    *************************************************************/
    ngOnInit(): void {
        this._sideDrawerTransition = new SlideInOnTopTransition();
	if (application.ios) {
	    this.isIOS = true;
	} else if (application.android) {
	    this.isAndroid = true;
	}
    }

    get sideDrawerTransition(): DrawerTransitionBase {
        return this._sideDrawerTransition;
    }

    get settings(): Observable {
	return EvaluationService.settings;
    }

    private loadFile(fileName: string): Promise<any> {
	const f = currentApp.getFile(fileName);
	return new Promise((resolve, reject) => {
	    let data = null;
	    let source = f.readSync((e) => {
		console.log("couldn't read file:");
		console.log(e);
		reject();
	    });
	    if (this.isIOS) {
		let arr = new ArrayBuffer(source.length);
		source.getBytes(arr);
		data = new Uint8Array(arr);
	    } else if (this.isAndroid) {
		data = new Uint8Array(source);
	    }
	    resolve(data);
	});
    }

    private performSmartDriveOTA(): Promise<any> {
	const fname = "/shared/ota/MX2+.14.ota";
	return this.loadFile(fname)
	    .then((otaData) => {
		console.log(`got MX2+ OTA, version: 0x${Number(otaData[0]).toString(16)}`);
	    });
    }

    private performSmartDriveBluetoothOTA(): Promise<any> {
	const fname = "/shared/ota/SmartDriveBluetooth.14.ota";
	return this.loadFile(fname)
	    .then((otaData) => {
		console.log("got SDBT OTA");
	    });
    }

    private performPushTrackerOTA(): Promise<any> {
	const fname = "/shared/ota/PushTracker.14.ota";
	return this.loadFile(fname)
	    .then((otaData) => {
		console.log("got PT OTA");
	    });
    }

    /* ***********************************************************
    * According to guidelines, if you have a drawer on your page, you should always
    * have a button that opens it. Use the showDrawer() function to open the app drawer section.
    *************************************************************/
    onDrawerButtonTap(): void {
        this.drawerComponent.sideDrawer.showDrawer();
    }

    onSaveSettingsTap(): void {
		confirm({
            title: "Save Settings?",
            message: "Send these settings to the PushTracker?",
            okButtonText: "Yes",
            cancelButtonText: "No"
		});
    }
}
