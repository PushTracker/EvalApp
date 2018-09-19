import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { PushTracker, Trial } from '@maxmobility/core';
import { BluetoothService, EvaluationService, LoggingService, ProgressService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { SnackBar } from 'nativescript-snackbar';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { View } from 'tns-core-modules/ui/core/view';
import { alert } from 'tns-core-modules/ui/dialogs';
import { CFAlertDialog, CFAlertStyle } from 'nativescript-cfalert-dialog';

@Component({
  selector: 'Trial',
  moduleId: module.id,
  templateUrl: './trial.component.html',
  styleUrls: ['./trial.component.css']
})
export class TrialComponent implements OnInit {
  // NON STATIC:
  @ViewChild('withPage')
  withPageView: ElementRef;
  @ViewChild('withoutPage')
  withoutPageView: ElementRef;
  @ViewChild('startWith')
  startWithView: ElementRef;
  @ViewChild('stopWith')
  stopWithView: ElementRef;
  @ViewChild('startWithout')
  startWithoutView: ElementRef;
  @ViewChild('stopWithout')
  stopWithoutView: ElementRef;
  snackbar = new SnackBar();
  trial = new Trial();
  trialTimeout = 15000; // 15 seconds

  // displaying trial info
  distanceDisplay = '--';
  pushWithDisplay = '--';
  coastWithDisplay = '--';
  timeWithDisplay = '--';
  pushWithoutDisplay = '--';
  coastWithoutDisplay = '--';
  timeWithoutDisplay = '--';
  please_connect_pt: string = this._translateService.instant('trial.please-connect-pt');
  connect_pushtracker_more_info: string = this._translateService.instant('trial.connect_pushtracker_more_info');
  starting_trial: string = this._translateService.instant('trial.starting-trial');
  stopping_trial: string = this._translateService.instant('trial.stopping-trial');
  okbuttontxt: string = this._translateService.instant('dialogs.ok');
  too_many_pts: string = this._translateService.instant('trial.errors.to-many-pts');
  failed_start_title: string = this._translateService.instant('trial.errors.failed-start.title');
  failed_start_message: string = this._translateService.instant('trial.errors.failed-start.message');
  failed_stop_title: string = this._translateService.instant('trial.errors.failed-stop.title');
  failed_stop_message: string = this._translateService.instant('trial.errors.failed-stop.message');
  pt_version_title: string = this._translateService.instant('trial.errors.pt-version.title');
  pt_version_message: string = this._translateService.instant('trial.errors.pt-version.message');

  private _cfAlert = new CFAlertDialog();

  constructor(
    private routerExtensions: RouterExtensions,
    private _progressService: ProgressService,
    private _bluetoothService: BluetoothService,
    private _evaluationService: EvaluationService,
    private zone: NgZone,
    private _translateService: TranslateService,
    private _loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.hideView(this.stopWithView.nativeElement);
    this.hideView(this.stopWithoutView.nativeElement);
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  hideView(view: View): void {
    view.opacity = 0;
    view.visibility = 'collapse';
  }

  animateViewIn(view: View): void {
    view.visibility = 'visible';
    view.animate({
      opacity: 1,
      duration: 500
    });
  }

  // button events
  onNext(): void {
    this._evaluationService.evaluation.trials.push(this.trial);
    this.routerExtensions.navigate(['/summary'], {
      // clearHistory: true,
      transition: {
        name: 'slide'
      }
    });
  }

  onBack(): void {
    this.routerExtensions.navigate(['/training'], {
      // clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  /**
   * Starts a trial WITH a SmartDrive unit
   */
  onStartWithTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this._noPushTrackersConnectedAlert();
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple(this.too_many_pts);
    } else if (!this.trial.startedWith) {
      // we have exactly one PushTracker connected
      const pt = connectedPTs[0];
      // check the version here (must be >= 1.5)
      if (pt.version === 0xff || pt.version < 0x15) {
        alert({
          title: this.pt_version_title,
          message: this.pt_version_message + PushTracker.versionByteToString(pt.version),
          okButtonText: this.okbuttontxt
        });
        return;
      }
      this.hideView(<View>this.startWithView.nativeElement);
      let haveDailyInfo = false;
      let haveDistance = false;
      let startWithTimeoutID = null;
      // let user know we're doing something
      this._progressService.show(this.starting_trial);
      // set up handlers
      const trialStartedHandler = () => {
        this.zone.run(() => {
          if (startWithTimeoutID) {
            clearTimeout(startWithTimeoutID);
          }
          this._progressService.hide();
          this.trial.with_start = new Date();
          pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this.trial.startedWith = true;
          this.animateViewIn(<View>this.stopWithView.nativeElement);
        });
      };
      const trialStartWithFailed = err => {
        this.zone.run(() => {
          if (startWithTimeoutID) {
            clearTimeout(startWithTimeoutID);
          }
          this._progressService.hide();
          pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this.animateViewIn(<View>this.startWithView.nativeElement);
          console.log(`Couldn't start trial: ${err}`);
          alert({
            title: this.failed_start_title,
            message: this.failed_start_message + err,
            okButtonText: this.okbuttontxt
          });
        });
      };
      const dailyInfoHandler = data => {
        // get the data
        this.trial.with_pushes = data.data.pushesWithout + data.data.pushesWith;
        // record that we've gotten it
        haveDailyInfo = true;
        if (haveDailyInfo && haveDistance) {
          trialStartedHandler();
        }
      };
      const distanceHandler = data => {
        // get the data
        this.trial.distance = PushTracker.caseTicksToMiles(data.data.coastDistance);
        // record that we've gotten it
        haveDistance = true;
        if (haveDailyInfo && haveDistance) {
          trialStartedHandler();
        }
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
      const sendDistance = () => {
        return pt.sendPacket('Command', 'DistanceRequest');
      };
      const sendSettings = () => {
        return pt.sendSettings('MX2+', 'English', 0x00, 1.0, this.trial.acceleration, this.trial.max_speed);
      };
      // wait for push / coast data and distance:
      pt.on(PushTracker.pushtracker_distance_event, distanceHandler);
      pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      // set timeout on trial starting
      startWithTimeoutID = setTimeout(() => {
        trialStartWithFailed('Timeout!');
      }, this.trialTimeout);
      // now actually try to send these data
      retry(3, sendSettings)
        .then(() => {
          return retry(3, sendDistance);
        })
        .catch(trialStartWithFailed);
    }
  }

  /**
   * Stops a Trial WITH a SmartDrive
   */
  onStopWithTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this.snackbar.simple(this.please_connect_pt);
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple(this.too_many_pts);
    } else if (!this.trial.finishedWith) {
      this.trial.with_end = new Date();
      // we have exactly one PushTracker connected
      const pt = connectedPTs[0];
      let haveDailyInfo = false;
      let haveDistance = false;
      let stopWithTimeoutID = null;
      // let user know we're doing something
      this._progressService.show('Stopping Trial');
      // set up handlers
      const trialStoppedHandler = () => {
        this.zone.run(() => {
          if (stopWithTimeoutID) {
            clearTimeout(stopWithTimeoutID);
          }
          this.trial.finishedWith = true;
          // diff is in ms
          this.trial.with_elapsed = (this.trial.with_end.getTime() - this.trial.with_start.getTime()) / 60000;
          this.trial.with_coast = this.trial.with_pushes ? (this.trial.with_elapsed * 60) / this.trial.with_pushes : 0;
          pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
          this.hideView(<View>this.stopWithView.nativeElement);
          this.distanceDisplay = `${this.trial.distance.toFixed(2)} m`;
          this.pushWithDisplay = `${this.trial.with_pushes}`;
          this.coastWithDisplay = `${this.trial.with_coast.toFixed(2)} s`;
          this.timeWithDisplay = Trial.timeToString(this.trial.with_elapsed * 60);
        });
      };
      const trialStopWithFailed = err => {
        this.zone.run(() => {
          this._loggingService.logException(err);
          if (stopWithTimeoutID) {
            clearTimeout(stopWithTimeoutID);
          }
          this._progressService.hide();
          pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          console.log(`Couldn't stop trial: ${err}`);
          alert({
            title: this.failed_stop_title,
            message: this.failed_stop_message + err,
            okButtonText: this.okbuttontxt
          });
        });
      };
      const dailyInfoHandler = data => {
        // get the data
        this.trial.with_pushes = data.data.pushesWithout + data.data.pushesWith - this.trial.with_pushes;
        // record that we've gotten it
        haveDailyInfo = true;
        if (haveDailyInfo && haveDistance) {
          trialStoppedHandler();
        }
      };
      const distanceHandler = data => {
        // get the data
        this.trial.distance = PushTracker.caseTicksToMiles(data.data.coastDistance) - this.trial.distance;
        this.trial.distance = this.trial.distance * 1604; // convert to meters
        // record that we've gotten it
        haveDistance = true;
        if (haveDailyInfo && haveDistance) {
          trialStoppedHandler();
        }
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
      const sendDistance = () => {
        return pt.sendPacket('Command', 'DistanceRequest');
      };
      // wait for push / coast data and distance:
      pt.on(PushTracker.pushtracker_distance_event, distanceHandler);
      pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      // set timeout on trial starting
      stopWithTimeoutID = setTimeout(() => {
        trialStopWithFailed('Timeout!');
      }, this.trialTimeout);
      // now actually send the distance command
      retry(3, sendDistance).catch(trialStopWithFailed);
    }
  }

  /**
   * Starts a Trial WITHOUT a SmartDrive
   */
  onStartWithoutTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    console.log('connectedPTs', connectedPTs);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this._noPushTrackersConnectedAlert();
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple(this.too_many_pts);
    } else if (!this.trial.startedWithout) {
      // we have exactly one PushTracker connected
      const pt = connectedPTs[0];
      // check the version here (must be >= 1.5)
      if (pt.version === 0xff || pt.version < 0x15) {
        // TODO: this doesn't necessarily need to be 1.5 since we're
        // not using distance command
        alert({
          title: this.pt_version_title,
          message: this.pt_version_message + PushTracker.versionByteToString(pt.version),
          okButtonText: this.okbuttontxt
        });
        return;
      }
      this.hideView(<View>this.startWithoutView.nativeElement);
      let startWithoutTimeoutID = null;
      // let user know we're doing something
      this._progressService.show(this.starting_trial);
      // set up handlers
      const trialStartedHandler = () => {
        this.zone.run(() => {
          if (startWithoutTimeoutID) {
            clearTimeout(startWithoutTimeoutID);
          }
          this._progressService.hide();
          this.trial.startedWithout = true;
          this.trial.without_start = new Date();
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this.animateViewIn(<View>this.stopWithoutView.nativeElement);
        });
      };
      const trialStartWithoutFailed = err => {
        this.zone.run(() => {
          if (startWithoutTimeoutID) {
            clearTimeout(startWithoutTimeoutID);
          }
          this._progressService.hide();
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this.animateViewIn(<View>this.startWithoutView.nativeElement);
          console.log(`Couldn't start trial: ${err}`);
          alert({
            title: this.failed_start_title,
            message: this.failed_start_message + err,
            okButtonText: this.okbuttontxt
          });
        });
      };
      const dailyInfoHandler = data => {
        // get the data
        this.trial.without_pushes = data.data.pushesWithout + data.data.pushesWith;
        // record that we've gotten it
        trialStartedHandler();
      };
      // set timeout on trial starting
      startWithoutTimeoutID = setTimeout(() => {
        trialStartWithoutFailed('Timeout!');
      }, this.trialTimeout);
      pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
    }
  }

  /**
   * Stops a Trial WITHOUT a SmartDrive
   */
  onStopWithoutTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this.snackbar.simple(this.please_connect_pt);
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple(this.too_many_pts);
    } else if (!this.trial.finishedWithout) {
      this.trial.without_end = new Date();
      // we have exactly one PushTracker connected
      const pt = connectedPTs[0];
      let stopWithoutTimeoutID = null;
      // let user know we're doing something
      this._progressService.show(this.stopping_trial);
      // set up handlers
      const trialStoppedHandler = () => {
        this.zone.run(() => {
          if (stopWithoutTimeoutID) {
            clearTimeout(stopWithoutTimeoutID);
          }
          this.trial.finishedWithout = true;
          this.trial.without_elapsed = (this.trial.without_end.getTime() - this.trial.without_start.getTime()) / 60000;
          this.trial.without_coast = this.trial.without_pushes
            ? (this.trial.without_elapsed * 60) / this.trial.without_pushes
            : 0;
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
          this.hideView(<View>this.stopWithoutView.nativeElement);
          this.pushWithoutDisplay = `${this.trial.without_pushes}`;
          this.coastWithoutDisplay = `${this.trial.without_coast.toFixed(2)} s`;
          this.timeWithoutDisplay = Trial.timeToString(this.trial.without_elapsed * 60);
        });
      };
      const trialStopWithoutFailed = err => {
        this.zone.run(() => {
          if (stopWithoutTimeoutID) {
            clearTimeout(stopWithoutTimeoutID);
          }
          this._progressService.hide();
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          console.log(`Couldn't stop trial: ${err}`);
          alert({
            title: this.failed_stop_title,
            message: this.failed_stop_message + err,
            okButtonText: this.okbuttontxt
          });
        });
      };
      const dailyInfoHandler = data => {
        // get the data
        this.trial.without_pushes = data.data.pushesWithout + data.data.pushesWith - this.trial.without_pushes;
        // record that we've gotten it
        trialStoppedHandler();
      };
      // set timeout on trial starting
      stopWithoutTimeoutID = setTimeout(() => {
        trialStopWithoutFailed('Timeout!');
      }, this.trialTimeout);
      // wait for push / coast data and distance:
      pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
    }
  }

  onSwitchChecked(key, args) {
    this.trial[key] = args.value;
  }

  onTextChange(key, args) {
    this.trial[key] = args.value;
  }

  onSliderUpdate(key, args) {
    this.trial[key] = Math.round(args.object.value) / 10;
  }

  private _noPushTrackersConnectedAlert() {
    this.snackbar
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
  }
}
