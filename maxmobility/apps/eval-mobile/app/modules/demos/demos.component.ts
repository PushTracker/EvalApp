import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { RouterExtensions } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
const Demos = [
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 00001',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 00001',
    Firmware: 'SD Firmware: 0.0.01',
    LastUsed: new Date(1988, 10, 23).toLocaleDateString(),
    Location: 'Mountain View, CA'
},
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11001',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 11001',
    Firmware: 'SD Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Nashville, TN'
},
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11002',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 110002',
    Firmware: 'SD Firmware: 1.1',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Breckenridge, CO'
},
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11003',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 11003',
    Firmware: 'SD Firmware: 1.1',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Seattle, WA'
},
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11004',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 11004',
    Firmware: 'SD Firmware: 1.2',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'San Francisco, CA'
},
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11005',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 11005',
    Firmware: 'SD Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Los Angeles, CA'
},
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11006',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 11006',
    Firmware: 'SD Firmware: 1.2',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'New Orleans, LA'
},
    {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11007',
    Model: "MX2 +",
    PTSerialNumber: 'PT: 11007',
    Firmware: 'SD Firmware: 1.1',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'New York, NY'
}
];

export { Demos };

@Component({
    selector: 'Demos',
    moduleId: module.id,
    templateUrl: './demos.component.html',
    styleUrls: ['./demos.component.css']
})
export class DemosComponent implements OnInit {
    constructor(private barcodeScanner: BarcodeScanner, private routerExtensions: RouterExtensions) {}

    @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

    public demos = Demos;

    private _sideDrawerTransition: DrawerTransitionBase;

    onDemoTap(args) {
	console.log('onDemoTap index: ' + args.index);
    }

    onScan() {
	this.barcodeScanner.scan({
	    formats: "QR_CODE, EAN_13",
	    cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
	    cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
	    message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
	    showFlipCameraButton: true,   // default false
	    preferFrontCamera: false,     // default false
	    showTorchButton: true,        // default false
	    beepOnScan: true,             // Play or Suppress beep on scan (default true)
	    torchOn: false,               // launch with the flashlight on (default false)
	    closeCallback: () => { console.log("Scanner closed")}, // invoked when the scanner was closed (success or abort)
	    resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
	    openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
	}).then((result) => {
	    // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
	    const msg = `Format: ${result.format},\nValue: ${result.text}`;
	    console.log(msg);
	    alert({
		title: "Scan result",
		message: msg,
		okButtonText: "OK"
	    });
	}).catch((errorMessage) => {
	    console.log("No scan. " + errorMessage);
	});
    }

    ngOnInit() {
	this._sideDrawerTransition = new SlideAlongTransition();
    }

    get sideDrawerTransition(): DrawerTransitionBase {
	return this._sideDrawerTransition;
    }

    onDrawerButtonTap(): void {
	this.drawerComponent.sideDrawer.showDrawer();
    }

    onNavBtnTap(): void {
    this.routerExtensions.navigate(['/home'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }
}
