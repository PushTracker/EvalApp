import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { isAndroid, isIOS } from 'platform';

import * as geolocation from 'nativescript-geolocation';
import { Accuracy } from 'ui/enums'; // used to describe at what accuracy the location should be get
const httpModule = require('http');
var api_key = 'pk.eyJ1IjoiZmluZ2VyNTYzIiwiYSI6ImNqYXZmYTZ0bDVtYmcyd28yZ2ZwandxYWcifQ.ROCLEdkuzALMsVQedcIeAQ';

import { Demo } from '@maxmobility/core';
import { DemoService } from '@maxmobility/mobile';

@Component({
  selector: 'Demos',
  moduleId: module.id,
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent implements OnInit {
  public demos: ObservableArray<Demo> = new ObservableArray<Demo>([]);

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
    console.log('onDemoTap index: ' + args.index);
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
        // Get current location with high accuracy
        return geolocation.getCurrentLocation({
          desiredAccuracy: Accuracy.high,
          maximumAge: 5000,
          timeout: 20000
        });
      })
      .then(location => {
        // now make the demo
        console.log(`Registered SD: ${sdSN}, PT: ${ptSN}`);
        const coord = [location.longitude, location.latitude];
        return this.coordToLocation(location).then(location => {
          console.log(`Got location '${location}' from ${coord}`);
          const demo = new Demo({
            geo: coord,
            location: location,
            model: 'MX2+',
            smartdrive_serial_number: sdSN,
            pushtracker_serial_number: ptSN
          });
          return this._demoService.create(demo);
        });
      })
      .then(() => {
        return this._demoService
          .load()
          .then((_demos: Array<Demo>) => {
            this.demos.splice(0, this.demos.length, ..._demos);
          })
          .catch(err => {
            console.log(`Couldn't load demos: ${err}`);
          });
      })
      .catch(errorMessage => {
        console.log('No scan. ' + errorMessage);
      });
  }

  private coordToLocation(coord: any): Promise<string> {
    // see https://www.mapbox.com/api-documentation/?language=cURL#retrieve-places-near-a-location
    return new Promise((resolve, reject) => {
      let userLoc = `${coord.longitude},${coord.latitude}`;
      httpModule
        .getJSON('https://api.mapbox.com/geocoding/v5/mapbox.places/' + userLoc + '.json?access_token=' + api_key)
        .then(
          function(r) {
            const location = r.features[0].place_name; //JSON.stringify(r, null, 2);
            resolve(location);
          },
          function(e) {
            reject(`Couldn't get location: ${e}`);
          }
        );
    });
  }

  ngOnInit() {
    geolocation.enableLocationRequest();
    this._demoService
      .load()
      .then((_demos: Array<Demo>) => {
        this.demos.splice(0, this.demos.length, ..._demos);
      })
      .catch(err => {
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
}
