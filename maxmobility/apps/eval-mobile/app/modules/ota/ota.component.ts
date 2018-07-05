// angular
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationStart, Router } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import timer = require('tns-core-modules/timer');
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import { alert } from 'tns-core-modules/ui/dialogs';
import { Progress } from 'tns-core-modules/ui/progress';
import { Page } from 'tns-core-modules/ui/page';
import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
import { Color } from 'tns-core-modules/color';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { AnimationCurve } from 'tns-core-modules/ui/enums';
import { View } from 'tns-core-modules/ui/core/view';
import { Animation, AnimationDefinition } from 'tns-core-modules/ui/animation';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { TranslateService } from '@ngx-translate/core';

// libs
import { BluetoothService, FirmwareService, ProgressService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';

@Component({
  selector: 'OTA',
  moduleId: module.id,
  templateUrl: './ota.component.html',
  styleUrls: ['./ota.component.css']
})
export class OTAComponent implements OnInit, OnDestroy {
  // PUBLIC MEMBERS
  @ViewChild('slides') slides: ElementRef;
  selectedPage = 0;
  connected = false;
  updating = false;
  searching = false;

  bluetoothReady = false;

  // text
  updatingButtonText = this._translateService.instant('ota.begin');

  smartDriveOTAs: ObservableArray<SmartDrive> = new ObservableArray();
  pushTrackerOTAs: ObservableArray<PushTracker> = new ObservableArray();
  otaDescription: ObservableArray<string> = new ObservableArray([this._translateService.instant('ota.downloading')]);

  snackbar = new SnackBar();

  private routeSub: any; // subscription to route observer
  private slideInterval: number = 5000;
  private slideIntervalID: any;

  constructor(
    private http: HttpClient,
    private page: Page,
    private routerExtensions: RouterExtensions,
    private router: Router,
    private _translateService: TranslateService,
    private _progressService: ProgressService,
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService
  ) {
    if (this._firmwareService.description.length) {
      this.otaDescription.splice(0, this.otaDescription.length, ...this._firmwareService.description.slice());
    }
    // register for description updates
    this._firmwareService.description.on(ObservableArray.changeEvent, args => {
      this.otaDescription.splice(0, this.otaDescription.length, ...this._firmwareService.description.slice());
    });
  }

  ngOnInit() {
    // see https://github.com/NativeScript/nativescript-angular/issues/1049
    this.routeSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.cancelOTAs(true);
        if (this.slideIntervalID) {
          clearInterval(this.slideIntervalID);
        }
      }
    });

    this.page.on(Page.navigatingFromEvent, event => {
      if (this.slideIntervalID) {
        clearInterval(this.slideIntervalID);
      }
      // this.ngOnDestroy();
    });

    if (this.slideIntervalID) {
      clearInterval(this.slideIntervalID);
    }
    this.slideIntervalID = setInterval(() => {
      this.slides.nextSlide();
    }, this.slideInterval);
  }

  ngOnDestroy() {
    this.cancelOTAs(true);
    this.routeSub.unsubscribe();
    if (this.slideIntervalID) {
      clearInterval(this.slideIntervalID);
    }
  }

  get currentVersion(): string {
    return PushTracker.versionByteToString(this._firmwareService.firmwares.PT.version);
  }

  get ready(): boolean {
    return this._firmwareService.haveFirmwares;
  }

  onDrawerButtonTap(): void {}

  rssiToColor(_rssi): string {
    let rssi = null;
    try {
      rssi = parseInt(_rssi);
    } catch (err) {
      console.log(`Couldn't parse RSSI(${_rssi}): ${err}`);
    }
    if (rssi === null) return 'red';
    if (rssi > -70) return 'green';
    if (rssi > -80) return 'GoldenRod';
    if (rssi > -90) return 'OrangeRed';
    return 'red';
  }

  // Connectivity
  discoverSmartDrives() {
    this._progressService.show(this._translateService.instant('bluetooth.searching'));
    return this._bluetoothService.scanForSmartDrive().then(() => {
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
              title: this._translateService.instant('bluetooth.errors.unavailable.title'),
              message: this._translateService.instant('bluetooth.errors.unavailable.message'),
              okButtonText: this._translateService.instant('dialogs.ok')
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
    this.updatingButtonText = this._translateService.instant('ota.cancel');
    return Promise.resolve().then(() => {
      // OTA the selected smart drive(s)
      const smartDriveOTATasks = this.smartDriveOTAs.map(sd => {
        return sd.performOTA(
          this._firmwareService.firmwares['BLE'].data,
          this._firmwareService.firmwares['MCU'].data,
          this._firmwareService.firmwares['BLE'].version,
          this._firmwareService.firmwares['MCU'].version,
          300000
        );
      });

      const pushTrackerOTATasks = this.pushTrackerOTAs.map(pt => {
        return pt.performOTA(
          this._firmwareService.firmwares['PT'].data,
          this._firmwareService.firmwares['PT'].version,
          300000
        );
      });

      const otaTasks = smartDriveOTATasks.concat(pushTrackerOTATasks);

      if (otaTasks && otaTasks.length) {
        this.updating = true;
        return Promise.all(otaTasks);
      } else {
        return alert({
          title: this._translateService.instant('ota.errors.devices.title'),
          message: this._translateService.instant('ota.errors.devices.message'),
          okButtonText: this._translateService.instant('dialogs.ok')
        }).then(() => []);
      }
    });
  }

  private cancelOTAs(doCancel: boolean) {
    this.updating = false;
    this.updatingButtonText = this._translateService.instant('ota.begin');
    if (doCancel) {
      console.log('Cancelling all otas!');
      this.smartDriveOTAs.map(sd => sd.cancelOTA());
      this.pushTrackerOTAs.map(pt => pt.cancelOTA());
    }
  }
}
