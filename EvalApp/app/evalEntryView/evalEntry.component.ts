import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { registerElement } from "nativescript-angular/element-registry";
registerElement("VideoPlayer", () => require("nativescript-videoplayer").Video);

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
    public Units: Array<SegmentedBarItem> = [];

    public isIOS: boolean = false;
    public isAndroid: boolean = false;
    
    // private members
    private _sideDrawerTransition: DrawerTransitionBase;
    private picker: ColorPicker = new ColorPicker();

    constructor() {
		new PerformanceMonitor().start({
			// options
		  });
	ControlMode.Options.map((o) => {
	    const item = new SegmentedBarItem();
	    item.title = o;
	    this.ControlModes.push(item);
	});
	Units.Options.map((o) => {
	    const item = new SegmentedBarItem();
	    item.title = o;
	    this.Units.push(item);
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

    public onControlModeChange(args): void {
	let segmentedBar = <SegmentedBar>args.object;
	this.settings.set("controlMode", ControlMode.Options[segmentedBar.selectedIndex]);
    }

    public getControlModeIndex(): number {
	return ControlMode.Options.indexOf(this.settings.get("controlMode"));
    }

    public onUnitsChange(args): void {
	let segmentedBar = <SegmentedBar>args.object;
	this.settings.set("units", Units.Options[segmentedBar.selectedIndex]);
    }

    public getUnitsIndex(): number {
	return Units.Options.indexOf(this.settings.get("units"));
    }

    public onSliderUpdate(key, args) {
	this.settings.set(key, args.object.value);
    }

    public onPickColor() {
	this.picker.show(this.settings.get("ledColor").hex, "RGB").then((result: string) => {
	    if (result !== null && result !== undefined) {
		let newColor = null;
		if (typeof result === "string" && result.indexOf(',') > -1) {
		    let [r,g,b] = result.split(',').map((res) => { return parseInt(res); });
		    newColor = new Color(255, r, g, b);
		}
		else {
		    newColor = new Color(result);
		}
		this.settings.set("ledColor", newColor);
	    }
	});
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
	return SettingsService.settings;
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
