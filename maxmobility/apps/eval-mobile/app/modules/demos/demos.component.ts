import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { isAndroid, isIOS } from 'platform';
import { BluetoothService } from '@maxmobility/mobile';

const Demos = [
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 00001',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 00001',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
    LastUsed: new Date(1988, 10, 23).toLocaleDateString(),
    Location: 'Mountain View, CA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 11001',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 11001',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Nashville, TN'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 11002',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 110002',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Breckenridge, CO'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 11003',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 11003',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Seattle, WA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 11004',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 11004',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'San Francisco, CA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 11005',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 11005',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Los Angeles, CA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 11006',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 11006',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'New Orleans, LA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SDImage: '~/assets/images/smartDriveFull.png',
    PTImage: '~/assets/images/pushTrackerFull.png',
    SerialNumber: 'SD: 11007',
    Model: 'MX2 +',
    PTSerialNumber: 'PT: 11007',
    SDFirmware: 'SD Firmware: 1.4',
    SDBTFirmware: 'SD BT Firmware: 1.4',
    PTFirmware: 'PT Firmware: 1.4',
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
  ngOnInit(): void {
    console.log('HomeComponent OnInit');
  }
  constructor(private barcodeScanner: BarcodeScanner, private _routerExtensions: RouterExtensions) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  public demos = Demos;

  onDemoTap(args) {
    console.log('onDemoTap index: ' + args.index);

    const index = args.index;

    this._routerExtensions.navigate(['/demo-detail'], {
      queryParams: {
        index
      }
    });
  }

  onScan() {
    this.barcodeScanner
      .scan({
        formats: 'QR_CODE, EAN_13',
        cancelLabel: 'EXIT. Also, try the volume buttons!', // iOS only, default 'Close'
        cancelLabelBackgroundColor: '#333333', // iOS only, default '#000000' (black)
        message: 'Use the volume buttons for extra light', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        showFlipCameraButton: true, // default false
        preferFrontCamera: false, // default false
        showTorchButton: true, // default false
        beepOnScan: true, // Play or Suppress beep on scan (default true)
        torchOn: false, // launch with the flashlight on (default false)
        closeCallback: () => {
          console.log('Scanner closed');
        }, // invoked when the scanner was closed (success or abort)
        resultDisplayDuration: 500, // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
        openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
      })
      .then(result => {
        // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
        const deviceType = result.text.indexOf('B') > -1 ? 'PushTracker' : 'SmartDrive';
        const msg = `
Device: ${deviceType}
S/N:    ${result.text}`;
        console.log(msg);
        setTimeout(() => {
          alert({
            title: 'Scan result',
            message: msg,
            okButtonText: 'OK'
          });
        }, 500);
      })
      .catch(errorMessage => {
        console.log('No scan. ' + errorMessage);
      });
  }

  addDemo() {
    // add a new demo
    console.log('add a new demo');
  }
}
