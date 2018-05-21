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
  ) {
    // TODO: cases we need to handle:
    //  * an already connected pushtracker exists - what do we
    //    want to do here? should we inform the user that a
    //    pushtracker is already connected and try to see what
    //    version it is?

    // sign up for events on PushTrackers and SmartDrives
    // handle pushtracker connection events for existing pushtrackers
    console.log('registering for connection events!');
    const self = this;
    BluetoothService.PushTrackers.map(function(pt) {
      pt.on(PushTracker.pushtracker_connect_event, function(args) {
        self.onPushTrackerConnected();
      });
    });

    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, function(args) {
      if (args.action === 'add') {
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        pt.on(PushTracker.pushtracker_connect_event, function(arg) {
          self.onPushTrackerConnected();
        });
      }
    });
  }

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
    connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
    if (connectedPTs.length <= 0) {
      // no pushtrackers are connected - wait for them to be connected
      this.snackbar.simple('Please connect your PushTracker');
      /*
	    const options: SnackBarOptions = {
		actionText: 'Connect',
		snackText: 'Please connect your PushTracker',
		hideDelay: 10000
	    };
	    */
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

    /*
	this.snackbar.action(options).then(args => {
	    if (args.command === 'Action') {
		confirm({
		    title: 'Connecting...',
		    message: 'Please make sure SmartDrive is on.',
		    okButtonText: 'It Is',
		    cancelButtonText: 'Whoops'
		}).then(result => {
		    if (result) {
			// tslint:disable-next-line:no-shadowed-variable
			this.snackbar.simple('Connecting to SmartDrive.', 'red', '#fff').then(args => {
			    // connect()
			});
		    } else {
			// tslint:disable-next-line:no-shadowed-variable
			this.snackbar.simple('Connecting to SmartDrive', 'red', '#fff').then(args => {
			    // connect()
			});
		    }
		});
	    } else {
		// dismiss
	    }
	});
	*/
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
