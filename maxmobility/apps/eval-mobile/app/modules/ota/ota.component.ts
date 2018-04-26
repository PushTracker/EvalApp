// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from 'ui/scroll-view';
import { Color } from 'tns-core-modules/color';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { AnimationCurve } from 'ui/enums';
import { View } from 'ui/core/view';
import { Animation, AnimationDefinition } from 'ui/animation';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { Observable, Scheduler } from 'rxjs';

// libs
import { BluetoothService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';

// const timeElapsed = Observable.defer(() => {
//     const start = Scheduler.animationFrame.now();
//     return Observable.interval(1)
//         .map(() => Math.floor((Date.now() - start)));
// });

// const duration = (totalMs) =>
//     timeElapsed
//         .map(elapsedMs => elapsedMs / totalMs)
//         .takeWhile(t => t <= 1);

// const amount = (d) => (t) => t * d;

// const elasticOut = (t) =>
//     Math.sin(-13.0 * (t + 1.0) *
//         Math.PI / 2) *
//     Math.pow(2.0, -10.0 * t) +
//     1.0;

@Component({
  selector: 'OTA',
  moduleId: module.id,
  templateUrl: './ota.component.html',
  styleUrls: ['./ota.component.css']
})
export class OTAComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  @ViewChild('scrollView') scrollView: ElementRef;
  @ViewChild('otaTitleView') otaTitleView: ElementRef;
  @ViewChild('otaProgressViewSD') otaProgressViewSD: ElementRef;
  @ViewChild('otaProgressViewPT') otaProgressViewPT: ElementRef;
  @ViewChild('otaFeaturesView') otaFeaturesView: ElementRef;

  connected = false;
  updating = false;

  // text for buttons and titles in different states
  initialTitleText = 'Press the right button on your PushTracker to connect. (use the one here to test)';
  connectedTitleText = 'Firmware Version 1.5';

  initialButtonText = 'Begin Firmware Updates';
  updatingButtonText = 'Updating SmartDrive firmware...';

  //bTSmartDriveConnectionIcon = String.fromCharCode(0xf293);
  //bTPushTrackerConnectionIcon = String.fromCharCode(0xf293);

  sdBtProgressValue = 0;
  sdMpProgressValue = 0;
  ptBtProgressValue = 0;

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(
    private http: HttpClient,
    private routerExtensions: RouterExtensions,
    private _bluetoothService: BluetoothService
  ) {}

  ngOnInit(): void {
    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.opacity = 0;

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.opacity = 0;

    const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
    otaProgressViewPT.opacity = 0;

    const otaFeaturesView = <View>this.otaFeaturesView.nativeElement;
    otaFeaturesView.opacity = 0;

    this._sideDrawerTransition = new SlideInOnTopTransition();

    // TODO: cases we need to handle:
    //  * an already connected pushtracker exists - what do we
    //    want to do here? should we inform the user that a
    //    pushtracker is already connected and try to see what
    //    version it is?

    // sign up for events on PushTrackers and SmartDrives
    // handle pushtracker connection events for existing pushtrackers
    console.log('registering for connection events!');
    BluetoothService.PushTrackers.map(pt => {
      //console.log(pt);
      pt.on(PushTracker.pushtracker_connect_event, args => {
        console.log(`PT CONNECTED EVENT!`);
        if (pt.paired === true) {
          this.onPushTrackerConnected();
        }
      });
    });
    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        //console.log(`PT ADDED EVENT!`);
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        pt.on(PushTracker.pushtracker_connect_event, args => {
          //console.log(`PT CONNECTED EVENT!`);
          if (/*pt.paired === true*/ true) {
            this.onPushTrackerConnected();
          }
        });
      }
    });

    // start discovering smartDrives here; given a list of
    // available smartDrives - ask the user which one they want to
    // update

    // smartdrives
    BluetoothService.SmartDrives.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        //console.log(`SD ADDED EVENT`);
      }
    });
  }

  // DEBUGGING
  onPtButtonTapped() {
    this.onPushTrackerConnected();
  }

  onSdButtonTapped() {
    this.onPushTrackerConnected();
  }
  // END DEBUGGING

  // Connectivity
  onPushTrackerConnected() {
    this.connected = true;
    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.animate({
      opacity: 1,
      duration: 500
    });
  }

  discoverSmartDrives() {
    // show list of SDs
    return this._bluetoothService.scanForSmartDrive().then(() => {
      console.log(`Found ${BluetoothService.SmartDrives.length} SmartDrives!`);
      return BluetoothService.SmartDrives;
    });
  }

  selectSmartDrives(smartDrives) {
    // takes a list of smart drives and prompts the user to select
    // which of the smartdrives they're interested in. might be
    // more than one
    var selectedSmartDrives = [];
    if (smartDrives && smartDrives.length) {
      if (smartDrives.length > 1) {
        // select smart drive(s) here
        // TODO: add UI for selecting one or more of the smartdrives
        selectedSmartDrives = smartDrives;
      } else {
        selectedSmartDrives = smartDrives;
      }
    }
    return selectedSmartDrives;
  }

  onStartOtaUpdate() {
    const scrollView = this.scrollView.nativeElement as ScrollView;

    // const scrollView = new ScrollView();

    const offset = scrollView.scrollableHeight;
    console.log(offset);

    scrollView.scrollToVerticalOffset(offset, true);

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.animate({
      opacity: 1,
      duration: 500
    });

    const otaFeaturesView = <View>this.otaFeaturesView.nativeElement;
    otaFeaturesView.animate({
      opacity: 1,
      duration: 500
    });

    // TODO: Discover SmartDrives
    // TODO: Prompt user to select the SmartDrive
    // TODO: connect to the selected SmartDrive
    // TODO: wait for version info from connected pushtracker / smartdrives
    // TODO: prompt user (if the version is already up to date) if they want to force the ota
    // TODO: begin OTA process for PushTracker and SD
    // TODO: handle OTA done for PushTracker
    // TODO: handle OTA done for SmartDrive

    if (!this.updating) {
      this.discoverSmartDrives()
        .then(smartDrives => {
          // if more than one smart drive is found then we
          // should pop up to ask the user to select (possibly
          // more than one), else we just auto-select the only
          // one
          return this.selectSmartDrives(smartDrives);
        })
        .then(selectedSmartDrives => {
          // connect to the selected smart drive(s)
          var tasks = selectedSmartDrives.map(sd => {
            return new Promise((resolve, reject) => {
              this._bluetoothService.connect(
                sd.address,
                function(data) {
                  sd.handleConnect();
                  console.log(`connected to ${data.UUID}::${data.name}`);
                  resolve();
                },
                function(data) {
                  sd.handleDisconnect();
                }
              );
            });
          });
          return Promise.all(tasks);
        })
        .then(connectionStatus => {})
        .then(versionInfo => {});
    }

    this.updating = true;
    /*
	  let intervalID = null;
	  let updatingPT = false;
	  intervalID = setInterval(() => {
	  this.sdBtProgressValue += 15;
	  if (this.sdBtProgressValue > 100) {
	  this.sdBtProgressValue = 100;
	  }
	  this.sdMpProgressValue += 25;
	  if (this.sdMpProgressValue > 100) {
	  this.sdMpProgressValue = 100;
	  }

	  if (this.sdMpProgressValue >= 100 && this.sdBtProgressValue >= 100) {
	  this.ptBtProgressValue += 25;
	  if (this.ptBtProgressValue > 100) {
	  this.ptBtProgressValue = 100;
	  }

	  if (!updatingPT) {
	  const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
	  otaProgressViewPT.animate({
	  opacity: 1,
	  duration: 500
	  });
	  this.otaButtonText = 'updating PushTracker';
	  updatingPT = true;
	  }

	  if (this.ptBtProgressValue >= 100) {
	  this.otaButtonText = 'Update Complete';
	  // cancel the interval we have set
	  clearInterval(intervalID);

	  setTimeout(() => {
	  this.routerExtensions.navigate(['/pairing'], {
	  clearHistory: true
	  });
	  }, 1500);
	  }
	  }
	  }, 500);
	*/
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }
  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
