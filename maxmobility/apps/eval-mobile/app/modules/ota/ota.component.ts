import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { PushTracker, SmartDrive } from '@maxmobility/core';
import { BluetoothService, FirmwareService, LoggingService, ProgressService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Carousel, CarouselItem } from 'nativescript-carousel';
import { Subscription } from 'rxjs';
import { Color } from 'tns-core-modules/color';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { isAndroid } from 'tns-core-modules/platform';
import { EventData } from 'tns-core-modules/ui/core/view';
import { alert, confirm } from 'tns-core-modules/ui/dialogs';
import { Label } from 'tns-core-modules/ui/label';
import { Page } from 'tns-core-modules/ui/page';

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
  // translation - changes depending on state
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

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  get ready(): boolean {
    return this._firmwareService.haveFirmwares;
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

  async checkForNewFirmwareTap() {
    const x = this._firmwareService.currentVersion;

    const result = await confirm({
      message: this._translateService.instant('ota.check_new_firmware_message'),
      okButtonText: this._translateService.instant('dialogs.yes'),
      cancelButtonText: this._translateService.instant('dialogs.no'),
      cancelable: true
    });

    if (result === true) {
      // show indicator for download
      this._progressService.show(this._translateService.instant('ota.downloading'));

      const carousel = this.carousel.nativeElement as Carousel;
      console.log('carousel', carousel);

      this._firmwareService
        .downloadFirmwares()
        .then(() => {
          console.log('firmwares updated');
          this._progressService.hide();

          // remove old items and add new from the translation file firmware string array
          this._loadFirmwareDescriptionItems(carousel);
        })
        .catch(error => {
          this._progressService.hide();
          this._loggingService.logException(error);
          alert({
            message: this._translateService.instant('ota.check_firmware_error'),
            okButtonText: this._translateService.instant('dialogs.ok')
          });
        });
    }
  }

  /**
   * Load the initial carousel items based on the firmware.currentversion string array from translation files
   */
  onCarouselLoad(args: EventData): void {
    const carousel = args.object as Carousel;
    this._loadFirmwareDescriptionItems(carousel);
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

  async onRefreshDeviceList(): Promise<any> {
    // if bluetooth is not enabled, return and alert user

    const isEnabled = await this._bluetoothService.radioEnabled();
    if (!this._bluetoothService.enabled || !isEnabled) {
      console.log('bluetooth service is not enabled');
      alert({
        message: this._translateService.instant('bluetooth.enable-bluetooth'),
        okButtonText: this._translateService.instant('dialogs.ok')
      });
      return;
    }
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

  /**
   * Will update the items in the carousel based on the firmware.VERSION string array
   * @param carousel [Carousel]
   */
  private _loadFirmwareDescriptionItems(carousel: any) {
    // remove all children from the carousel (carousel extends GridLayout)
    carousel.removeChildren();

    const firmwareDescriptionItems = this._translateService.instant('firmware.' + this._firmwareService.currentVersion);
    console.log('current firmware description items', firmwareDescriptionItems);

    const whiteColor = new Color('#fff');

    firmwareDescriptionItems.forEach((item: string) => {
      // console.log('description', item);
      // create a new label for the carousel item
      const label = new Label();
      label.text = item;
      label.color = whiteColor;
      label.margin = 5;
      label.fontSize = 20;
      label.verticalAlignment = 'middle';
      label.padding = 15;
      label.textWrap = true;
      label.className = 'features';

      // create new carousel item and add label to it
      const newCarouselItem = new CarouselItem() as any;
      newCarouselItem.addChild(label);

      // add the carouselItem to the carousel
      carousel.addChild(newCarouselItem);

      if (isAndroid) {
        const adapter = carousel.android.getAdapter() as android.support.v4.view.PagerAdapter;
        if (adapter) {
          adapter.notifyDataSetChanged();
          console.log('BRAD - FIX THIS WHEN 4.1.0 is published, PR is pending to correct the types and simplify this.');
          carousel._pageIndicatorView.setCount(firmwareDescriptionItems.length);
        }
        // carousel.pageIndicatorCount = firmwareDescriptionItems.length;
      }

      carousel.refresh();
    });
  }
}
