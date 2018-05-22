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
import { Observable, fromObject } from 'tns-core-modules/data/observable';

// app
import { ProgressService } from '@maxmobility/mobile';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { BluetoothService } from '@maxmobility/mobile';

export class Trial {
  name: string = '';
  // questionnaire
  flat: boolean = false;
  ramap: boolean = false;
  inclines: boolean = false;
  other: boolean = false;
  // settings
  max_speed: number = 0.7;
  acceleration: number = 0.3;
  // metrics
  distance: number = 0;
  // with SD
  with_pushes: number = 0;
  with_coast: number = 0;
  with_distance: number = 0;
  with_start: Date;
  with_end: Date;
  with_elapsed: number = 0;
  // without SD
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

  trial: Observable = fromObject(new Trial());

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
      const trialStartedHandler = () => {
        this._progressService.hide();
        this.trial.set('with_start', new Date());
        pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
        pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
        this.startedWith = true;
      };
      const dailyInfoHandler = data => {
        // get the data
        this.trial.set('with_pushes', data.data.pushesWithout + data.data.pushesWith);
        // record that we've gotten it
        haveDailyInfo = true;
        if (haveDailyInfo && haveDistance) {
          trialStartedHandler();
        }
      };
      const distanceHandler = data => {
        // get the data
        this.trial.set('distance', PushTracker.caseTicksToMiles(data.data.coastDistance));
        // record that we've gotten it
        haveDistance = true;
        if (haveDailyInfo && haveDistance) {
          trialStartedHandler();
        }
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
        const trialStoppedHandler = () => {
          this.finishedWith = true;
          this.trial.set('with_end', new Date());
          this.trial.set(
            'with_elapsed',
            (this.trial.get('with_end').getTime() - this.trial.get('with_start').getTime()) / 60000
          ); // diff is in ms
          this.trial.set('with_coast', this.trial.get('with_elapsed') * 60 / this.trial.get('with_pushes'));
          pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
        };
        const dailyInfoHandler = data => {
          // get the data
          this.trial.set('with_pushes', data.data.pushesWithout + data.data.pushesWith - this.trial.get('with_pushes'));
          // record that we've gotten it
          haveDailyInfo = true;
          if (haveDailyInfo && haveDistance) {
            trialStoppedHandler();
          }
        };
        const distanceHandler = data => {
          // get the data
          this.trial.set(
            'distance',
            PushTracker.caseTicksToMiles(data.data.coastDistance) - this.trial.get('distance')
          );
          this.trial.set('distance', this.trial.get('distance') * 1604); // convert to meters
          // record that we've gotten it
          haveDistance = true;
          if (haveDailyInfo && haveDistance) {
            trialStoppedHandler();
          }
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
      const trialStartedHandler = () => {
        this._progressService.hide();
        this.startedWithout = true;
        this.trial.set('without_start', new Date());
        pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      };
      const dailyInfoHandler = data => {
        // get the data
        this.trial.set('without_pushes', data.data.pushesWithout + data.data.pushesWith);
        // record that we've gotten it
        trialStartedHandler();
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
        const trialStoppedHandler = () => {
          this.finishedWithout = true;
          this.trial.set('without_end', new Date());
          this.trial.set(
            'without_elapsed',
            (this.trial.get('without_end').getTime() - this.trial.get('without_start').getTime()) / 60000
          ); // diff is in ms
          this.trial.set('without_coast', this.trial.get('without_elapsed') * 60 / this.trial.get('without_pushes'));
          pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
          this._progressService.hide();
        };
        const dailyInfoHandler = data => {
          // get the data
          this.trial.set(
            'without_pushes',
            data.data.pushesWithout + data.data.pushesWith - this.trial.get('without_pushes')
          );
          // record that we've gotten it
          trialStoppedHandler();
        };
        // wait for push / coast data and distance:
        pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      } else {
      }
    }
  }

  onTextChange(args) {
    this.trial.set('name', args.value);
  }

  onSliderUpdate(key, args) {
    this.trial.set(key, args.object.value / 10);
  }

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
