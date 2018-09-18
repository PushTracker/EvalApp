import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { PushTracker, SmartDrive } from '@maxmobility/core';
import { BluetoothService, FirmwareService, LoggingService, ProgressService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { EventData } from 'tns-core-modules/ui/core/view';
import { alert } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
const Carousel = require('nativescript-carousel').Carousel;
const CarouselItem = require('nativescript-carousel').CarouselItem;

@Component({
  selector: 'OTA',
  moduleId: module.id,
  templateUrl: './ota.component.html',
  styleUrls: ['./ota.component.css']
})
export class OTAComponent implements OnInit {
  @ViewChild('carousel')
  carousel: ElementRef;
  selectedPage = 0;
  connected = false;
  updating = false;
  searching = false;
  bluetoothReady = false;
  // text
  updatingButtonText = this._translateService.instant('ota.begin');
  smartDriveOTAs = new ObservableArray<SmartDrive>();
  pushTrackerOTAs = new ObservableArray<PushTracker>();
  private routeSub: Subscription; // subscription to route observer
  private slideInterval = 5000;
  private slideIntervalID: any;

  constructor(
    private _page: Page,
    private _router: Router,
    private _translateService: TranslateService,
    private _progressService: ProgressService,
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService,
    private _loggingService: LoggingService
  ) {}

  ngOnInit() {
    // see https://github.com/NativeScript/nativescript-angular/issues/1049
    this.routeSub = this._router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.cancelOTAs(true);
        if (this.slideIntervalID) {
          clearInterval(this.slideIntervalID);
        }
      }
    });

    this._page.on(Page.navigatingFromEvent, event => {
      if (this.slideIntervalID) {
        clearInterval(this.slideIntervalID);
      }
    });

    if (this.slideIntervalID) {
      clearInterval(this.slideIntervalID);
    }
  }

  get otaDescription(): string[] {
    let otaDesc = [this._translateService.instant('ota.downloading')];
    if (this.ready) {
      let tmp = this._translateService.instant('firmware.' + this.currentVersion);
      if (typeof tmp !== 'string' && tmp.length) {
        otaDesc = tmp;
      } else {
        tmp = this._translateService.instant('firmware.not-found');
        if (typeof tmp !== 'string' && tmp.length) {
          otaDesc = tmp;
        } else {
          otaDesc = [this._translateService.instant('general.error')];
        }
      }
    }
    return otaDesc;
  }

  onCarouselLoad(args: EventData): void {
    const carousel = args.object as any;

    // setTimeout(() => {
    //   console.log('timeout adding slide');
    //   const x = new Label();
    //   x.color = new Color('#fff');
    //   x.text = 'What is going to happen?!?!';
    //   // create carouselItem
    //   const item = new CarouselItem();
    //   item.addChild(x);
    //   // add carouselItem to the carousel
    //   carousel.addChild(item);

    //   if (isAndroid) {
    //     const adapter = carousel.android.getAdapter();
    //     if (adapter) {
    //       adapter.notifyDataSetChanged();
    //       carousel._pageIndicatorView.setCount(this.otaDescription.length);
    //     }
    //   }

    //   carousel.refresh();
    // }, 2000);
  }

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  get ready(): boolean {
    return this._firmwareService.haveFirmwares;
  }

  rssiToColor(_rssi): string {
    let rssi = null;
    try {
      rssi = parseInt(_rssi, 10);
    } catch (err) {
      console.log(`Couldn't parse RSSI(${_rssi}): ${err}`);
    }
    if (rssi === null) {
      return 'red';
    }
    if (rssi > -70) {
      return 'green';
    }
    if (rssi > -80) {
      return 'GoldenRod';
    }
    if (rssi > -90) {
      return 'OrangeRed';
    }
    return 'red';
  }

  // Connectivity
  discoverSmartDrives() {
    this._progressService.show(this._translateService.instant('bluetooth.searching'));
    return this._bluetoothService
      .scanForSmartDrive()
      .then(() => {
        this._progressService.hide();
        return BluetoothService.SmartDrives;
      })
      .catch(e => {
        this._progressService.hide();
        this._loggingService.logException(e);
      });
  }

  async onStartOtaUpdate() {
    const isAvailable = await this._bluetoothService.available();

    if (!isAvailable) {
      // bluetooth is not available
      alert({
        title: 'Bluetooth Unavailable',
        message: 'Bluetooth service unavailable - reinitializing!',
        okButtonText: 'OK'
      }).then(() => {
        this._bluetoothService.advertise();
      });
      return;
    }

    if (!this.updating) {
      console.log('start performing OTAs...');
      // start updating
      this.performOTAs()
        .then(otaStatuses => {
          console.log(`completed all otas with statuses: ${otaStatuses}`);
          this.cancelOTAs(false);
        })
        .catch(err => {
          this._loggingService.logException(err);
          console.log(`Couldn't finish updating: ${err}`);
          this.cancelOTAs(true);
        });
    } else {
      // we're already updating
      this.cancelOTAs(true);
    }
  }

  onRefreshDeviceList(): Promise<any> {
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
          this._firmwareService.firmwares.BLE.data,
          this._firmwareService.firmwares.MCU.data,
          this._firmwareService.firmwares.BLE.version,
          this._firmwareService.firmwares.MCU.version,
          300000
        );
      });

      const pushTrackerOTATasks = this.pushTrackerOTAs.map(pt => {
        return pt.performOTA(
          this._firmwareService.firmwares.PT.data,
          this._firmwareService.firmwares.PT.version,
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
