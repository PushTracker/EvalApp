import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { PushTracker, SmartDrive } from '@maxmobility/core';
import {
  BluetoothService,
  FirmwareService,
  LoggingService,
  ProgressService
} from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Carousel, CarouselItem } from 'nativescript-carousel';
import { Subscription } from 'rxjs';
import * as app from 'tns-core-modules/application';
import { Color } from 'tns-core-modules/color';
import {
  ChangedData,
  ObservableArray
} from 'tns-core-modules/data/observable-array';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { EventData } from 'tns-core-modules/ui/core/view';
import { alert, confirm } from 'tns-core-modules/ui/dialogs';
import { Label } from 'tns-core-modules/ui/label';
import { Page } from 'tns-core-modules/ui/page';
import { ScrollView } from 'tns-core-modules/ui/scroll-view';

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
    private _routerExtensions: RouterExtensions,
    private _translateService: TranslateService,
    private _progressService: ProgressService,
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService,
    private _loggingService: LoggingService
  ) {
    this._page.className = 'blue-gradient-down';

    // add current pushtrackers to ota candidates
    BluetoothService.PushTrackers.map(pt => {
      this.pushTrackerOTAs.push(pt);
    });
    this.register();
  }

  ngOnInit() {
    // see https://github.com/NativeScript/nativescript-angular/issues/1049
    this.routeSub = this._router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.unregister();
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

  register(): void {
    this.unregister();

    // handle pushtracker pairing events for existing pushtrackers
    console.log('ota: registering for events!');
    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(
      ObservableArray.changeEvent,
      (args: ChangedData<number>) => {
        if (args.action === 'add') {
          const pt = BluetoothService.PushTrackers.getItem(
            BluetoothService.PushTrackers.length - 1
          );
          if (pt) {
            this.pushTrackerOTAs.push(pt);
          }
        }
      }
    );
  }

  unregister(): void {
    console.log('ota: unregistering for events!');
    BluetoothService.PushTrackers.off(ObservableArray.changeEvent);
  }

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  get ready(): boolean {
    return this._firmwareService.haveFirmwares;
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
      this._progressService.show(
        this._translateService.instant('ota.downloading')
      );

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
    this._progressService.show(
      this._translateService.instant('bluetooth.searching')
    );
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
        title: this._translateService.instant(
          'bluetooth.errors.unavailable.title'
        ),
        message: this._translateService.instant(
          'bluetooth.errors.unavailable.message'
        ),
        okButtonText: this._translateService.instant('dialogs.ok')
      }).then(() => {
        this._bluetoothService.advertise();
      });
      return;
    }

    if (!this.updating) {
      alert({
        title: this._translateService.instant('ota.warnings.starting.title'),
        message: this._translateService.instant(
          'ota.warnings.starting.message'
        ),
        okButtonText: this._translateService.instant('dialogs.ok')
      })
        .then(() => {
          // disable back nav for iOS - add event listener for android hardware back button
          if (isIOS) {
            this._page.enableSwipeBackNavigation = false;
          } else if (isAndroid) {
            // setting the event listener for the android back pressed event
            app.android.on(
              app.AndroidApplication.activityBackPressedEvent,
              (args: app.AndroidActivityBackPressedEventData) => {
                // cancel the back nav for now then confirm with user to leave
                args.cancel = true;

                console.log('back button pressed');
                confirm({
                  title: this._translateService.instant(
                    'ota.warnings.leaving.title'
                  ),
                  message: this._translateService.instant(
                    'ota.warnings.leaving.message'
                  ),
                  okButtonText: this._translateService.instant('dialogs.yes'),
                  cancelable: true,
                  cancelButtonText: this._translateService.instant(
                    'dialogs.cancel'
                  )
                }).then((result: boolean) => {
                  if (result === true) {
                    // user wants to leave so remove the back pressed event
                    app.android.off(
                      app.AndroidApplication.activityBackPressedEvent
                    );
                    // now actually navigate back
                    this._routerExtensions.back();
                  }
                });
              }
            );
          }

          console.log('start performing OTAs...');
          // start updating
          return this.performOTAs();
        })
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
      this.searching = true;
      return this._bluetoothService
        .available()
        .then(available => {
          if (available) {
            return this.discoverSmartDrives();
          } else {
            // bluetooth is not available
            return alert({
              title: this._translateService.instant(
                'bluetooth.errors.unavailable.title'
              ),
              message: this._translateService.instant(
                'bluetooth.errors.unavailable.message'
              ),
              okButtonText: this._translateService.instant('dialogs.ok')
            }).then(() => {
              this.searching = false;
              return this._bluetoothService.advertise();
            });
          }
        })
        .then(() => {
          this.smartDriveOTAs.splice(0, this.smartDriveOTAs.length);
          BluetoothService.SmartDrives.map(sd => {
            this.smartDriveOTAs.push(sd);
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
    // re-enable back nav and remove the back pressed event listener for android
    if (isIOS) {
      this._page.enableSwipeBackNavigation = true;
    } else if (isAndroid) {
      console.log(
        'turning off the back pressed event for android hardware button'
      );
      app.android.off(app.AndroidApplication.activityBackPressedEvent);
    }

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

    const firmwareDescriptionItems = this._translateService.instant(
      'firmware.' + this._firmwareService.currentVersion
    );
    console.log('current firmware description items', firmwareDescriptionItems);

    const whiteColor = new Color('#fff');

    firmwareDescriptionItems.forEach((item: string) => {
      // create a new scrollview for the carousel item
      const sv = new ScrollView();

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

      // add the label as a child of the scrollview
      sv.content = label;

      // create new carousel item and add label to it
      const newCarouselItem = new CarouselItem() as any;
      newCarouselItem.addChild(sv);

      // add the carouselItem to the carousel
      carousel.addChild(newCarouselItem);

      if (isAndroid) {
        const adapter = carousel.android.getAdapter() as android.support.v4.view.PagerAdapter;
        if (adapter) {
          adapter.notifyDataSetChanged();
          console.log(
            'BRAD - FIX THIS WHEN 4.1.0 is published, PR is pending to correct the types and simplify this.'
          );
          carousel._pageIndicatorView.setCount(firmwareDescriptionItems.length);
        }
        // carousel.pageIndicatorCount = firmwareDescriptionItems.length;
      }

      carousel.refresh();
    });
  }
}
