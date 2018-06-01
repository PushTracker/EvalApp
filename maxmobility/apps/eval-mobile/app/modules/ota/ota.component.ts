import * as application from 'tns-core-modules/application';

// angular
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationStart, Router } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import timer = require('tns-core-modules/timer');
import { alert } from 'tns-core-modules/ui/dialogs';
import { Progress } from 'tns-core-modules/ui/progress';
import { Page } from 'tns-core-modules/ui/page';
import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
import { Color } from 'tns-core-modules/color';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { AnimationCurve } from 'tns-core-modules/ui/enums';
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import { View } from 'tns-core-modules/ui/core/view';
import { Animation, AnimationDefinition } from 'tns-core-modules/ui/animation';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { Observable, Scheduler } from 'rxjs';

// libs
import { knownFolders, File } from 'tns-core-modules/file-system';
import { BluetoothService, ProgressService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { constructDependencies } from '@angular/core/src/di/reflective_provider';
import { constants } from 'fs';

const currentApp = knownFolders.currentApp();

@Component({
  selector: 'OTA',
  moduleId: module.id,
  templateUrl: './ota.component.html',
  styleUrls: ['./ota.component.css']
})
export class OTAComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  // PUBLIC MEMBERS
  connected = false;
  updating = false;
  searching = false;

  // text for buttons and titles in different states
  initialTitleText = 'Press the right button on your PushTracker to connect. (use the one here to test)';
  connectedTitleText = 'Firmware Version 1.5';

  updatingButtonText = 'Begin Firmware Updates';

  otaDescription = [
    'Updated company logo branding when booting PT from sleep.',
    'Now show estimated drive range on the PT in DisplayInfo  battery status screen.',
    'Now show OTA status bar and percentage on PT when performing PT OTA.',
    `When SD is not paired (e.g. after OTA) and the left button is pressed
to turn 'SD On', the PT goes directly into pairing to SD mode.`,
    `When App is not paired (e.g. after OTA) and the right button is pressed
to connect to the app, the PT goes directly into pairing to app mode.`,
    'Bugfixes to pairing process for handling multiple devices.'
  ];

  smartDriveOTAs: ObservableArray<SmartDrive> = new ObservableArray();
  pushTrackerOTAs: ObservableArray<PushTracker> = new ObservableArray();

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;
  private routeSub: any; // subscription to route observer

  constructor(
    private http: HttpClient,
    private page: Page,
    private routerExtensions: RouterExtensions,
    private router: Router,
    private _progressService: ProgressService,
    private _bluetoothService: BluetoothService
  ) {}

  ngOnInit() {
    // see https://github.com/NativeScript/nativescript-angular/issues/1049
    this.routeSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.cancelOTAs(true);
      }
    });

    this.page.on(Page.navigatingFromEvent, event => {
      // this.ngOnDestroy();
    });

    this._sideDrawerTransition = new SlideAlongTransition();

    //this.refreshDeviceList();
  }

  ngOnDestroy() {
    this.cancelOTAs(true);
    this.routeSub.unsubscribe();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  // Connectivity
  discoverSmartDrives() {
    this._progressService.show('Searching for SmartDrives');
    return this._bluetoothService.scanForSmartDrive().then(() => {
      console.log(`Found ${BluetoothService.SmartDrives.length} SmartDrives!`);
      this._progressService.hide();
      return BluetoothService.SmartDrives;
    });
  }

  onStartOtaUpdate() {
    this._bluetoothService.available().then(available => {
      if (available) {
        if (!this.updating) {
          // start updating
          this.performOTAs()
            .then(otaStatuses => {
              console.log(`completed all otas with statuses: ${otaStatuses}`);
              this.cancelOTAs(false);
            })
            .catch(err => {
              console.log(`Couldn't finish updating: ${err}`);
              this.cancelOTAs(true);
            });
        } else {
          // we're already updating
          this.cancelOTAs(true);
        }
      } else {
        // bluetooth is not available
        alert({
          title: 'Bluetooth Unavailable',
          message: 'Bluetooth service unavailable - reinitializing!',
          okButtonText: 'OK'
        }).then(() => {
          this._bluetoothService.advertise();
        });
      }
    });
  }

  public onRefreshDeviceList() {
    this.refreshDeviceList();
  }

  private refreshDeviceList(): Promise<any> {
    if (!this.updating && !this.searching) {
      this.smartDriveOTAs.splice(0, this.smartDriveOTAs.length);
      this.pushTrackerOTAs.splice(0, this.pushTrackerOTAs.length);
      this.searching = true;
      return this._bluetoothService
        .available()
        .then(available => {
          if (available) {
            return this.discoverSmartDrives();
          } else {
            // bluetooth is not available
            return alert({
              title: 'Bluetooth Unavailable',
              message: 'Bluetooth service unavailable - reinitializing!',
              okButtonText: 'OK'
            }).then(() => {
              this.searching = false;
              return this._bluetoothService.advertise();
            });
          }
        })
        .then(() => {
          this.smartDriveOTAs.splice(0, this.smartDriveOTAs.length);
          this.pushTrackerOTAs.splice(0, this.pushTrackerOTAs.length);
          BluetoothService.SmartDrives.map(sd => {
            this.smartDriveOTAs.push(sd);
          });
          BluetoothService.PushTrackers.map(pt => {
            this.pushTrackerOTAs.push(pt);
          });
          this.searching = false;
        });
    }
  }

  private performOTAs(): Promise<any> {
    this.updatingButtonText = 'Cancel All Firmware Updates';
    let ptFW = null;
    let bleFW = null;
    let mcuFW = null;
    // load firmware files here!
    return this.loadFile('/assets/ota/PushTracker.15.ota')
      .then(otaData => {
        ptFW = otaData;
        return this.loadFile('/assets/ota/SmartDriveBluetooth.15.ota');
      })
      .then(otaData => {
        bleFW = otaData;
        return this.loadFile('/assets/ota/MX2+.15.ota');
      })
      .then(otaData => {
        mcuFW = otaData;
        console.log(`got MX2+ OTA, version: 0x${Number(mcuFW[0]).toString(16)}`);
        // OTA the selected smart drive(s)
        const smartDriveOTATasks = this.smartDriveOTAs.map(sd => {
          return sd.performOTA(bleFW, mcuFW, 0x15, 0x15, 300000);
        });

        const pushTrackerOTATasks = this.pushTrackerOTAs.map(pt => {
          return pt.performOTA(ptFW, 0x15, 300000);
        });

        const otaTasks = smartDriveOTATasks.concat(pushTrackerOTATasks);

        if (otaTasks) {
          this.updating = true;
          return Promise.all(otaTasks);
        } else {
          return alert({
            title: 'No Devices',
            message: 'No PushTrackers or SmartDrives found!',
            okButtonText: 'OK'
          }).then(() => []);
        }
      });
  }

  private cancelOTAs(doCancel: boolean) {
    this.updating = false;
    this.updatingButtonText = 'Begin Firmware Updates';
    if (doCancel) {
      console.log('Cancelling all otas!');
      this.smartDriveOTAs.map(sd => sd.cancelOTA());
      this.pushTrackerOTAs.map(pt => pt.cancelOTA());
    }
  }

  private loadFile(fileName: string): Promise<any> {
    const f = currentApp.getFile(fileName);
    return new Promise((resolve, reject) => {
      let data = null;
      const source = f.readSync(e => {
        console.log("couldn't read file:");
        console.log(e);
        reject();
      });
      if (isIOS) {
        const arr = new ArrayBuffer(source.length);
        source.getBytes(arr);
        data = new Uint8Array(arr);
      } else if (isAndroid) {
        data = new Uint8Array(source);
      }
      resolve(data);
    });
  }
}
