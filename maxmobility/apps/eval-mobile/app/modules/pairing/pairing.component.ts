import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { PushTracker } from '@maxmobility/core';
import { BluetoothService, LoggingService, ProgressService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { PageRoute, RouterExtensions } from 'nativescript-angular/router';
import { Feedback } from 'nativescript-feedback';
import { SnackBar } from 'nativescript-snackbar';
import { CFAlertDialog, CFAlertStyle } from 'nativescript-cfalert-dialog';
import { Gif } from 'nativescript-gif';
import { switchMap } from 'rxjs/operators';
import { ChangedData, ObservableArray } from 'tns-core-modules/data/observable-array';

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css']
})
export class PairingComponent {
  @ViewChild('carousel')
  carousel: ElementRef;
  selectedPage = 0;
  slides = this._translateService.instant('pairing');
  private feedback: Feedback;
  private _cfAlert = new CFAlertDialog();
  private _snackbar = new SnackBar();

  // TODO: make these use this._translateService.instant();
  saving_settings: string = 'Saving Settings';
  failed_settings_title: string = 'Failed';
  failed_settings_message: string = 'Could not save settings:';
  okbuttontxt: string = this._translateService.instant('dialogs.ok');
  please_connect_pt: string = this._translateService.instant('trial.please-connect-pt');
  connect_pushtracker_more_info: string = this._translateService.instant('trial.connect_pushtracker_more_info');
  too_many_pts: string = this._translateService.instant('trial.errors.too-many-pts');

  public settings = new PushTracker.Settings();
  public pushSettings = new PushTracker.PushSettings();

  constructor(
    private pageRoute: PageRoute,
    private _zone: NgZone,
    private _translateService: TranslateService,
    private _progressService: ProgressService,
    private _loggingService: LoggingService
  ) {
    // update slides
    this.slides = this._translateService.instant('pairing');

    // figure out which slide we're going to
    this.pageRoute.activatedRoute.pipe(switchMap(activatedRoute => activatedRoute.queryParams)).forEach(params => {
      if (params.index) {
        this.selectedPage = params.index;
        console.log(this.selectedPage);
      }
    });

    this.feedback = new Feedback();

    // handle pushtracker pairing events for existing pushtrackers
    console.log('registering for pairing events!');
    BluetoothService.PushTrackers.map(pt => {
      pt.on(PushTracker.pushtracker_paired_event, args => {
        this.pushTrackerPairingSuccess();
      });
      pt.on(PushTracker.pushtracker_connect_event, args => {
        if (pt.paired) {
          this.pushTrackerConnectionSuccess();
        }
      });
    });

    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        if (pt) {
          pt.on(PushTracker.pushtracker_paired_event, pairedArgs => {
            this.pushTrackerPairingSuccess();
          });
          pt.on(PushTracker.pushtracker_connect_event, arg => {
            if (pt.paired) {
              this.pushTrackerConnectionSuccess();
            }
          });
        }
      }
    });
  }

  /**
   * Helper method to check for a connected PushTracker from the BluetoothService.PushTrackers array.
   */
  private _getOneConnectedPushTracker() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);

    // no pushtrackers are connected - will show snackbar alert
    if (connectedPTs.length <= 0) {
      // this._noPushTrackersConnectedAlert();

      this._snackbar
        .action({
          actionText: 'More Info',
          snackText: this.please_connect_pt,
          hideDelay: 4000
        })
        .then(result => {
          if (result.command === 'Action') {
            this._cfAlert.show({
              dialogStyle: CFAlertStyle.ALERT,
              message: this.connect_pushtracker_more_info,
              cancellable: true
            });
          }
        });

      return null;
    }

    // too many pushtrackers connected - don't know which to use!
    if (connectedPTs.length > 1) {
      this._snackbar.simple(this.too_many_pts);
      return null;
    }

    return connectedPTs[0];
  }

  // settings controls
  onSettingsUpdate(key: string, args: any) {
    this.settings[key] = args.object.value;
  }

  onSettingsChecked(key, args) {
    this.settings[key] = args.value;
  }

  onPushSettingsUpdate(key: string, args: any) {
    this.pushSettings[key] = args.object.value;
  }

  onPushSettingsChecked(key, args) {
    this.pushSettings[key] = args.value;
  }

  onSaveSettings(args: any) {
    const pushTracker = this._getOneConnectedPushTracker();
    if (pushTracker === null) {
      return;
    } else if (pushTracker.version < 0x16) {
      this._snackbar
        .action({
          actionText: 'More Info',
          snackText: 'PushTracker out of Date!',
          hideDelay: 4000
        })
        .then(result => {
          if (result.command === 'Action') {
            this._cfAlert.show({
              dialogStyle: CFAlertStyle.ALERT,
              message:
                'PushTracker is version ' +
                pushTracker.version_string +
                ', needs to be at least ' +
                PushTracker.versionByteToString(0x16) +
                ' to receive PushSettings. PushSettings will not work!',
              cancellable: true
            });
          }
        });
    }
    // let user know we're doing something
    this._progressService.show(this.saving_settings);
    const settingsSucceeded = () => {
      this._zone.run(() => {
        this._progressService.hide();
      });
    };
    const settingsFailed = err => {
      this._zone.run(() => {
        this._progressService.hide();
        console.log(`Couldn't save settings: ${err}`);
        alert({
          title: this.failed_settings_title,
          message: this.failed_settings_message + err,
          okButtonText: this.okbuttontxt
        });
      });
    };
    const retry = (maxRetries, fn) => {
      return fn().catch(err => {
        this._loggingService.logException(err);
        if (maxRetries <= 0) {
          throw err;
        } else {
          console.log(`RETRYING: ${err}, ${maxRetries}`);
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              retry(maxRetries - 1, fn)
                .then(resolve)
                .catch(reject);
            }, 1000);
          });
        }
      });
    };
    const sendSettings = () => {
      return pushTracker.sendSettings(
        this.settings.controlMode,
        this.settings.units,
        this.settings.ezOn ? 0x01 : 0x00,
        this.settings.tapSensitivity / 100.0,
        this.settings.acceleration / 100.0,
        this.settings.maxSpeed / 100.0
      );
    };
    const sendPushSettings = () => {
      return pushTracker.sendPushSettings(
        this.pushSettings.threshold,
        this.pushSettings.timeWindow,
        this.pushSettings.clearCounter
      );
    };
    retry(3, sendSettings)
      .then(() => {
        return retry(3, sendPushSettings);
      })
      .then(settingsSucceeded)
      .catch(settingsFailed);
  }

  // Connectivity Events
  pushTrackerPairingSuccess() {
    this.feedback.success({
      title: this._translateService.instant('dialogs.success'),
      message: this._translateService.instant('bluetooth.pairing-success'),
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => {
        console.log('showSuccess tapped');
      }
    });
  }

  pushTrackerConnectionSuccess() {
    this.feedback.success({
      title: this._translateService.instant('dialogs.success'),
      message: this._translateService.instant('bluetooth.connection-success'),
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => {
        console.log('showSuccess tapped');
      }
    });
  }

  onGifTap(args) {
    const x = args.object as Gif;
    if (x.isPlaying()) {
      x.stop();
    } else {
      x.start();
    }
  }

  onCarouselLoad() {
    setTimeout(() => {
      this.carousel.nativeElement.selectedPage = this.selectedPage;
      this.carousel.nativeElement.refresh();
      console.log('Carousel loaded to ' + this.selectedPage);
    }, 100);
  }
}
