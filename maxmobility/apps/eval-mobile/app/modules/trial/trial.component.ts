// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { RouterExtensions } from 'nativescript-angular/router';
import { SegmentedBar, SegmentedBarItem } from 'tns-core-modules/ui/segmented-bar';
import { TextField } from 'tns-core-modules/ui/text-field';
import { confirm } from 'tns-core-modules/ui/dialogs';
import * as switchModule from 'tns-core-modules/ui/switch';
import { Observable } from 'tns-core-modules/data/observable';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';

// app
import { ProgressService } from '@maxmobility/mobile';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { EvaluationService, BluetoothService } from '@maxmobility/mobile';

export class Trial extends Observable {
  distance: number = 0;
  with_pushes: number = 0;
  with_coast: number = 0;
  with_distance: number = 0;
  with_start: Date;
  with_end: Date;
  with_elapsed: number = 0;
  without_pushes: number = 0;
  without_coast: number = 0;
  without_distance: number = 0;
  without_start: Date;
  without_end: Date;
  without_elapsed: number = 0;
}

@Component({
  selector: 'Trial',
  moduleId: module.id,
  templateUrl: './trial.component.html',
  styleUrls: ['./trial.component.css']
})
export class TrialComponent implements OnInit {
  // NON STATIC:
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  trialName: string = '';
  trial: Trial = new Trial();
  startedWith: boolean = false;
  startedWithout: boolean = false;
  finishedWith: boolean = false;
  finishedWithout: boolean = false;

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(
    private routerExtensions: RouterExtensions,
    private _progressService: ProgressService,
    private _bluetoothService: BluetoothService
  ) {}

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/summary'], {
      clearHistory: true,
      transition: {
        name: 'slide'
      }
    });
  }

  onBack(): void {
    this.routerExtensions.navigate(['/training'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  onStartWithTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this.snackbar.simple('Please connect your PushTracker');
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple('Too many PushTrackers connected - please only connect one!');
    } else {
      // we have exactly one PushTracker connected
      const pt = connectedPTs[0];
      let haveDailyInfo = false;
      let haveDistance = false;
      // let user know we're doing something
      this._progressService.show('Starting Trial');
      // set up handlers
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
      const trialStartedHandler = () => {
        this._progressService.hide();
        this.trial.with_start = new Date();
        pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
        pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
        this.startedWith = true;
      };
      // send command to get distance:
      pt.sendPacket('Command', 'DistanceRequest');
      // wait for push / coast data and distance:
      pt.on(PushTracker.pushtracker_distance_event, distanceHandler);
      pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
    }
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  onStopWithTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this.snackbar.simple('Please connect your PushTracker');
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple('Too many PushTrackers connected - please only connect one!');
    } else {
      if (!this.finishedWith) {
        // we have exactly one PushTracker connected
        const pt = connectedPTs[0];
        let haveDailyInfo = false;
        let haveDistance = false;
        // let user know we're doing something
        this._progressService.show('Stopping Trial');
        // set up handlers
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
        const trialStoppedHandler = () => {
          this.finishedWith = true;
          this.trial.with_end = new Date();
          this.trial.with_elapsed = (this.trial.with_end.getTime() - this.trial.with_start.getTime()) / 60000; // diff is in ms
          this.trial.with_coast = this.trial.with_pushes / (this.trial.with_elapsed * 60);
          pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
        };
        // send command to get distance:
        pt.sendPacket('Command', 'DistanceRequest');
        // wait for push / coast data and distance:
        pt.on(PushTracker.pushtracker_distance_event, distanceHandler);
        pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      } else {
      }
    }
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  onStartWithoutTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this.snackbar.simple('Please connect your PushTracker');
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple('Too many PushTrackers connected - please only connect one!');
    } else {
      // we have exactly one PushTracker connected
      const pt = connectedPTs[0];
      // let user know we're doing something
      this._progressService.show('Starting Trial');
      // set up handlers
      const dailyInfoHandler = data => {
        // get the data
        this.trial.without_pushes = data.data.pushesWithout + data.data.pushesWith;
        // record that we've gotten it
        trialStartedHandler();
      };
      const trialStartedHandler = () => {
        this._progressService.hide();
        this.startedWithout = true;
        this.trial.without_start = new Date();
        pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      };
      pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
    }
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  onStopWithoutTrial() {
    const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this.snackbar.simple('Please connect your PushTracker');
    } else if (connectedPTs.length > 1) {
      // too many pushtrackers connected - don't know which to use!
      this.snackbar.simple('Too many PushTrackers connected - please only connect one!');
    } else {
      if (!this.finishedWithout) {
        // we have exactly one PushTracker connected
        const pt = connectedPTs[0];
        // let user know we're doing something
        this._progressService.show('Stopping Trial');
        // set up handlers
        const dailyInfoHandler = data => {
          // get the data
          this.trial.without_pushes = data.data.pushesWithout + data.data.pushesWith - this.trial.without_pushes;
          // record that we've gotten it
          trialStoppedHandler();
        };
        const trialStoppedHandler = () => {
          this.finishedWithout = true;
          this.trial.without_end = new Date();
          this.trial.without_elapsed = (this.trial.without_end.getTime() - this.trial.without_start.getTime()) / 60000; // diff is in ms
          this.trial.without_coast = this.trial.without_pushes / (this.trial.without_elapsed * 60);
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
        };
        // wait for push / coast data and distance:
        pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      } else {
      }
    }
  }

  onTextChange(args) {
    const textField = <TextField>args.object;

    console.log('onTextChange');
    this.trialName = textField.text;
  }

  onReturn(args) {
    const textField = <TextField>args.object;

    console.log('onReturn');
    this.trialName = textField.text;
  }

  showAlert(result) {
    alert('Text: ' + result);
  }

  submit(result) {
    alert('Text: ' + result);
  }

  onSliderUpdate(key, args) {
    this.settings.set(key, args.object.value);
  }

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  get settings(): Observable {
    return EvaluationService.settings;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
