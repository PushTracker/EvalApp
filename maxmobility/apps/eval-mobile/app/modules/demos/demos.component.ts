import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { BarcodeScanner } from 'nativescript-barcodescanner';
const Demos = [
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 00001',
    PTSerialNumber: 'PT: 00001',
    Firmware: 'SD Firmware: 0.0.01',
    LastUsed: new Date(1988, 10, 23).toLocaleDateString(),
    Location: 'Mountain View, CA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11001',
    PTSerialNumber: 'PT: 11001',
    Firmware: 'SD Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Nashville, TN'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11002',
    PTSerialNumber: 'PT: 110002',
    Firmware: 'SD Firmware: 1.1',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Breckenridge, CO'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11003',
    PTSerialNumber: 'PT: 11003',
    Firmware: 'SD Firmware: 1.1',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Seattle, WA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11004',
    PTSerialNumber: 'PT: 11004',
    Firmware: 'SD Firmware: 1.2',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'San Francisco, CA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11005',
    PTSerialNumber: 'PT: 11005',
    Firmware: 'SD Firmware: 1.4',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'Los Angeles, CA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11006',
    PTSerialNumber: 'PT: 11006',
    Firmware: 'SD Firmware: 1.2',
    LastUsed: new Date().toLocaleDateString(),
    Location: 'New Orleans, LA'
  },
  {
    Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
    SerialNumber: 'SD: 11007',
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
  constructor() {}

  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  public demos = Demos;

  private _sideDrawerTransition: DrawerTransitionBase;

  onDemoTap(args) {
    console.log('onDemoTap');
  }

  onScan() {
    // this.barcodeScanner.scan({});
    console.log('No scan. ');
  }

  onScanResult(evt) {
    console.log(evt);
    console.log(evt.object);
    alert(evt.object);
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
}
