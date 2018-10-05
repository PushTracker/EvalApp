import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { PushTracker, Trial, Evaluation } from '@maxmobility/core';
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
  too_many_pts: string = this._translateService.instant('trial.errors.too-many-pts');
  failed_start_title: string = this._translateService.instant('trial.errors.failed-start.title');
  failed_start_message: string = this._translateService.instant('trial.errors.failed-start.message');
  failed_stop_title: string = this._translateService.instant('trial.errors.failed-stop.title');
  failed_stop_message: string = this._translateService.instant('trial.errors.failed-stop.message');
  pt_version_title: string = this._translateService.instant('trial.errors.pt-version.title');
  pt_version_message: string = this._translateService.instant('trial.errors.pt-version.message');
  trial = new Trial();

  private _trialTimeout = 15000; // 15 seconds
  private _cfAlert = new CFAlertDialog();
  private _snackbar = new SnackBar();

  constructor(
    private _routerExtensions: RouterExtensions,
    private _progressService: ProgressService,
    private _evaluationService: EvaluationService,
    private _zone: NgZone,
    private _translateService: TranslateService,
    private _loggingService: LoggingService
  ) {}

  ngOnInit() {
    this._hideview(this.stopWithView.nativeElement);
    this._hideview(this.stopWithoutView.nativeElement);
  }

  isIOS(): boolean {
    return isIOS;
  }

  // button events
  onNext(): void {
    // make sure we have an evaluation on the service since it defaults null
    if (!this._evaluationService.evaluation) {
      this._evaluationService.evaluation = new Evaluation();
    }

    this._evaluationService.evaluation.trials.push(this.trial);
    this._routerExtensions.navigate(['/summary'], {
      transition: {
        name: 'slide'
      }
    });
  }

  onBack(): void {
    this._routerExtensions.navigate(['/training'], {
      transition: {
        name: 'slideRight'
      }
    });
  }

  /**
   * Starts a trial WITH a SmartDrive unit
   */
  onStartWithTrial() {
    const pushTracker = this._getOneConnectedPushTracker();
    if (pushTracker === null) {
      return;
    }

    // if pushtracker is not up to date don't start trial
    const x = this._checkPushTrackerVersion(pushTracker);
    if (x === false) {
      return;
    }

    if (!this.trial.startedWith && pushTracker) {
      // let user know we're doing something
      this._progressService.show(this.starting_trial);

      this._hideview(this.startWithView.nativeElement as View);

      let haveDailyInfo = false;
      let haveDistance = false;
      let startWithTimeoutID = null;

      // set up handlers
      const trialStartedHandler = () => {
        this._zone.run(() => {
          if (startWithTimeoutID) {
            clearTimeout(startWithTimeoutID);
          }
          this._progressService.hide();
          this.trial.with_start = new Date();
          pushTracker.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this.trial.startedWith = true;
          this._animateViewIn(this.stopWithView.nativeElement as View);
        });
      };

      const trialStartWithFailed = err => {
        this._zone.run(() => {
          if (startWithTimeoutID) {
            clearTimeout(startWithTimeoutID);
          }
          this._progressService.hide();
          pushTracker.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._animateViewIn(this.startWithView.nativeElement as View);
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
        return pushTracker.sendPacket('Command', 'DistanceRequest');
      };

      const sendSettings = () => {
        return pushTracker.sendSettings('MX2+', 'English', 0x00, 1.0, this.trial.acceleration, this.trial.max_speed);
      };

      // wait for push / coast data and distance:
      pushTracker.on(PushTracker.pushtracker_distance_event, distanceHandler);
      pushTracker.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);

      // set timeout on trial starting
      startWithTimeoutID = setTimeout(() => {
        trialStartWithFailed('Timeout!');
      }, this._trialTimeout);

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
    const pushTracker = this._getOneConnectedPushTracker();
    if (pushTracker === null) {
      return;
    }

    if (!this.trial.finishedWith && pushTracker) {
      // let user know we're doing something
      this._progressService.show('Stopping Trial');

      this.trial.with_end = new Date();
      let haveDailyInfo = false;
      let haveDistance = false;
      let stopWithTimeoutID = null;

      // set up handlers
      const trialStoppedHandler = () => {
        this._zone.run(() => {
          if (stopWithTimeoutID) {
            clearTimeout(stopWithTimeoutID);
          }
          this.trial.finishedWith = true;
          // diff is in ms
          this.trial.with_elapsed = (this.trial.with_end.getTime() - this.trial.with_start.getTime()) / 60000;
          this.trial.with_coast = this.trial.with_pushes ? (this.trial.with_elapsed * 60) / this.trial.with_pushes : 0;
          pushTracker.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
          this._hideview(<View>this.stopWithView.nativeElement);
          this.distanceDisplay = `${this.trial.distance.toFixed(2)} m`;
          this.pushWithDisplay = `${this.trial.with_pushes}`;
          this.coastWithDisplay = `${this.trial.with_coast.toFixed(2)} s`;
          this.timeWithDisplay = Trial.timeToString(this.trial.with_elapsed * 60);
        });
      };

      const trialStopWithFailed = err => {
        this._zone.run(() => {
          this._loggingService.logException(err);
          if (stopWithTimeoutID) {
            clearTimeout(stopWithTimeoutID);
          }
          this._progressService.hide();
          pushTracker.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
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
        return pushTracker.sendPacket('Command', 'DistanceRequest');
      };

      // wait for push / coast data and distance:
      pushTracker.on(PushTracker.pushtracker_distance_event, distanceHandler);
      pushTracker.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);

      // set timeout on trial starting
      stopWithTimeoutID = setTimeout(() => {
        trialStopWithFailed('Timeout!');
      }, this._trialTimeout);

      // now actually send the distance command
      retry(3, sendDistance).catch(trialStopWithFailed);
    }
  }

  /**
   * Starts a Trial WITHOUT a SmartDrive
   */
  onStartWithoutTrial() {
    const pushTracker = this._getOneConnectedPushTracker();
    if (pushTracker === null) {
      return;
    }

    // if pushtracker is not up to date don't start trial
    const x = this._checkPushTrackerVersion(pushTracker);
    if (x === false) {
      return;
    }

    if (!this.trial.startedWithout && pushTracker) {
      // let user know we're doing something
      this._progressService.show(this.starting_trial);

      this._hideview(this.startWithoutView.nativeElement as View);

      let startWithoutTimeoutID = null;

      // set up handlers
      const trialStartedHandler = () => {
        this._zone.run(() => {
          if (startWithoutTimeoutID) {
            clearTimeout(startWithoutTimeoutID);
          }
          this._progressService.hide();
          this.trial.startedWithout = true;
          this.trial.without_start = new Date();
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._animateViewIn(<View>this.stopWithoutView.nativeElement);
        });
      };

      const trialStartWithoutFailed = err => {
        this._zone.run(() => {
          if (startWithoutTimeoutID) {
            clearTimeout(startWithoutTimeoutID);
          }
          this._progressService.hide();
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._animateViewIn(<View>this.startWithoutView.nativeElement);
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
      }, this._trialTimeout);
      pushTracker.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
    }
  }

  /**
   * Stops a Trial WITHOUT a SmartDrive
   */
  onStopWithoutTrial() {
    const pushTracker = this._getOneConnectedPushTracker();
    if (pushTracker === null) {
      return;
    }

    if (!this.trial.finishedWithout && pushTracker) {
      // let user know we're doing something
      this._progressService.show(this.stopping_trial);

      this.trial.without_end = new Date();
      let stopWithoutTimeoutID = null;

      // set up handlers
      const trialStoppedHandler = () => {
        this._zone.run(() => {
          if (stopWithoutTimeoutID) {
            clearTimeout(stopWithoutTimeoutID);
          }
          this.trial.finishedWithout = true;
          this.trial.without_elapsed = (this.trial.without_end.getTime() - this.trial.without_start.getTime()) / 60000;
          this.trial.without_coast = this.trial.without_pushes
            ? (this.trial.without_elapsed * 60) / this.trial.without_pushes
            : 0;
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
          this._hideview(<View>this.stopWithoutView.nativeElement);
          this.pushWithoutDisplay = `${this.trial.without_pushes}`;
          this.coastWithoutDisplay = `${this.trial.without_coast.toFixed(2)} s`;
          this.timeWithoutDisplay = Trial.timeToString(this.trial.without_elapsed * 60);
        });
      };

      const trialStopWithoutFailed = err => {
        this._zone.run(() => {
          if (stopWithoutTimeoutID) {
            clearTimeout(stopWithoutTimeoutID);
          }
          this._progressService.hide();
          pushTracker.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
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
      }, this._trialTimeout);

      // wait for push / coast data and distance:
      pushTracker.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
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

  private _hideview(view: View) {
    view.opacity = 0;
    view.visibility = 'collapse';
  }

  private _animateViewIn(view: View) {
    view.visibility = 'visible';
    view.animate({
      opacity: 1,
      duration: 500
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
          actionText: this._translateService.instant('buttons.more-info'),
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

  private _checkPushTrackerVersion(pt: PushTracker) {
    // check the version here (must be >= 1.5)
    if (pt.version === 0xff || pt.version < 0x15) {
      alert({
        title: this.pt_version_title,
        message: this.pt_version_message + PushTracker.versionByteToString(pt.version),
        okButtonText: this.okbuttontxt
      });
      return false;
    } else {
      return true;
    }
  }

  private _trialFailureUXError() {
    console.log('_trialFailureUXError');
  }
}
