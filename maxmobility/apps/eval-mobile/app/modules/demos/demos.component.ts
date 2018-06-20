import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { isAndroid, isIOS } from 'platform';
import { BluetoothService } from '@maxmobility/mobile';

import { Demo } from '@maxmobility/core';
import { DemoService } from '@maxmobility/mobile';

@Component({
  selector: 'Demos',
  moduleId: module.id,
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent implements OnInit {
  get Demos(): ObservableArray<Demo> {
    return DemoService.Demos;
  }

  constructor(
    private barcodeScanner: BarcodeScanner,
    private routerExtensions: RouterExtensions,
    private _demoService: DemoService
  ) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  onDemoTap(args) {
    const index = args.index;
    this.routerExtensions.navigate(['/demo-detail'], {
      queryParams: {
        index
      }
    });
  }

  onScan() {
    let ptSN = '';
    let sdSN = '';
    let nextDevice = '';

    return new Promise((resolve, reject) => {
      this.barcodeScanner
        .scan({
          formats: 'QR_CODE, EAN_13',
          cancelLabel: 'EXIT', // iOS only
          cancelLabelBackgroundColor: '#333333', // iOS only
          message: 'Scan a SmartDrive or PushTracker', // Android only
          showFlipCameraButton: true,
          preferFrontCamera: false,
          showTorchButton: true,
          beepOnScan: true,
          torchOn: false,
          closeCallback: () => {
            setTimeout(() => {
              resolve();
            }, 500);
          },
          resultDisplayDuration: 0, // Android only
          openSettingsIfPermissionWasPreviouslyDenied: true
        })
        .then(result => {
          let deviceType = result.text.indexOf('B') > -1 ? 'PushTracker' : 'SmartDrive';
          let msg = `
Device: ${deviceType}
S/N:    ${result.text}`;
          if (deviceType === 'PushTracker') {
            ptSN = result.text;
            nextDevice = 'SmartDrive';
          } else {
            sdSN = result.text;
            nextDevice = 'PushTracker';
          }
          console.log(msg);
        });
    })
      .then(() => {
        return new Promise((resolve, reject) => {
          this.barcodeScanner
            .scan({
              formats: 'QR_CODE, EAN_13',
              cancelLabel: 'EXIT',
              cancelLabelBackgroundColor: '#333333',
              message: 'Scan a ' + nextDevice,
              showFlipCameraButton: true,
              preferFrontCamera: false,
              showTorchButton: true,
              beepOnScan: true,
              torchOn: false,
              closeCallback: () => {
                setTimeout(() => {
                  resolve();
                }, 500);
              },
              resultDisplayDuration: 0,
              openSettingsIfPermissionWasPreviouslyDenied: true
            })
            .then(result => {
              console.log(`result: ${result}`);
              let deviceType = result.text.indexOf('B') > -1 ? 'PushTracker' : 'SmartDrive';
              let msg = `
Device: ${deviceType}
S/N:    ${result.text}`;
              if (deviceType === 'PushTracker') {
                ptSN = result.text;
              } else {
                sdSN = result.text;
              }
            });
        });
      })
      .then(() => {
        // now make the demo
        console.log(`Registered SD: ${sdSN}, PT: ${ptSN}`);
        const demo = new Demo({
          model: 'MX2+',
          smartdrive_serial_number: sdSN,
          pushtracker_serial_number: ptSN
        });
        return demo.use().then(() => {
          return this._demoService.create(demo);
        });
      })
      .then(() => {
        return this._demoService.load().catch(err => {
          console.log(`Couldn't load demos: ${err}`);
        });
      })
      .catch(errorMessage => {
        console.log('No scan. ' + errorMessage);
      });
  }

  ngOnInit() {
    this._demoService.load().catch(err => {
      console.log(`Couldn't load demos: ${err}`);
    });
  }

  onDrawerButtonTap(): void {}

  onNavBtnTap(): void {
    this.routerExtensions.navigate(['/home'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  addDemo() {
    // add a new demo
    console.log('add a new demo');
  }
}
