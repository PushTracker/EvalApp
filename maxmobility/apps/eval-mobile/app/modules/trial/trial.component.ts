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

// app
import { ProgressService } from '@maxmobility/mobile';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { EvaluationService, BluetoothService } from '@maxmobility/mobile';

@Component({
  selector: 'Trial',
  moduleId: module.id,
  templateUrl: './trial.component.html',
  styleUrls: ['./trial.component.css']
})
export class TrialComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  trialName: string = '';

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
  onStartTrial() {
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
        haveDailyInfo = true;
        if (haveDailyInfo && haveDistance) {
          trialStartedHandler();
        }
      };
      const distanceHandler = data => {
        haveDistance = true;
        if (haveDailyInfo && haveDistance) {
          trialStartedHandler();
        }
      };
      const trialStartedHandler = () => {
        this._progressService.hide();
        pt.off(PushTracker.pushtracker_distance_event, distanceHandler);
        pt.off(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
      };
      // send command to get distance:
      pt.sendPacket('Command', 'DistanceRequest');
      // wait for push / coast data and distance:
      pt.on(PushTracker.pushtracker_distance_event, distanceHandler);
      pt.on(PushTracker.pushtracker_daily_info_event, dailyInfoHandler);
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
