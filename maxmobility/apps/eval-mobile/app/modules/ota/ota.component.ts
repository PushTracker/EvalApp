import application = require('application');

// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import timer = require('tns-core-modules/timer');
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
import { Color } from 'tns-core-modules/color';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { AnimationCurve } from 'tns-core-modules/ui/enums';
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import { View } from 'tns-core-modules/ui/core/view';
import { Animation, AnimationDefinition } from 'tns-core-modules/ui/animation';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { Observable, Scheduler } from 'rxjs';

// libs;
import { knownFolders, File } from 'tns-core-modules/file-system';
import { BluetoothService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { constructDependencies } from '@angular/core/src/di/reflective_provider';
import { constants } from 'fs';

// app
import { ProgressService } from '@maxmobility/mobile';

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

const currentApp = knownFolders.currentApp();

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
  @ViewChild('otaProgressView') otaProgressView: ElementRef;
  @ViewChild('otaFeaturesView') otaFeaturesView: ElementRef;

  connected = false;
  updating = false;

  // text for buttons and titles in different states
  initialTitleText = 'Press the right button on your PushTracker to connect. (use the one here to test)';
  connectedTitleText = 'Firmware Version 1.5';

  initialButtonText = 'Begin Firmware Updates';
  updatingButtonText = 'Updating SmartDrive firmware...';

  // bTSmartDriveConnectionIcon = String.fromCharCode(0xf293);
  // bTPushTrackerConnectionIcon = String.fromCharCode(0xf293);

  otaDescription = [
    'Updated company logo branding when booting PT from sleep.',
    'Now show estimated drive range on the PT in DisplayInfo  battery status screen.',
    'Now show OTA status bar and percentage on PT when performing PT OTA.',
    "When SD is not paired (e.g. after OTA) and the left button is pressed to turn 'SD On', the PT goes directly into pairing to SD mode.",
    'When App is not paired (e.g. after OTA) and the right button is pressed to connect to the app, the PT goes directly into pairing to app mode.',
    'Bugfixes to pairing process for handling multiple devices.'
  ];

  smartDriveOTAs: ObservableArray<SmartDrive> = new ObservableArray();
  pushTrackerOTAs: ObservableArray<PushTracker> = new ObservableArray();

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(
    private http: HttpClient,
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

  ngOnInit() {
    this.hideView(<View>this.otaTitleView.nativeElement);
    this.hideView(<View>this.otaProgressView.nativeElement);
    this.hideView(<View>this.otaFeaturesView.nativeElement);
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  // view management
  hideView(view: View): void {
    view.opacity = 0;
    view.visibility = 'collapse';
  }

  animateViewIn(view: View): void {
    view.visibility = 'visible';
    view
      .animate({
        opacity: 1,
        duration: 500
      })
      .then(() => {
        // scroll to the new view
        const scrollView = this.scrollView.nativeElement as ScrollView;
        const offset = scrollView.scrollableHeight;
        scrollView.scrollToVerticalOffset(offset, true);
      });
  }
  // end view management

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
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
    this.animateViewIn(<View>this.otaTitleView.nativeElement);
  }

  discoverSmartDrives() {
    // show list of SDs
    return this._bluetoothService.scanForSmartDrive().then(() => {
      console.log(`Found ${BluetoothService.SmartDrives.length} SmartDrives!`);
      return BluetoothService.SmartDrives;
    });
  }

  select(objects) {
    // takes a list of objects and prompts the user to select
    // which of the objects they're interested in. might be
    // more than one
    let selected = [];
    if (objects && objects.length) {
      if (objects.length > 1) {
        // TODO: add UI for selecting one or more of the objects
        selected = objects;
      } else {
        selected = objects;
      }
    }
    return selected;
  }

  selectSmartDrives(smartDrives) {
    // takes a list of smart drives and prompts the user to select
    // which of the smartdrives they're interested in. might be
    // more than one
    let selectedSmartDrives = [];
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
    this.animateViewIn(<View>this.otaProgressView.nativeElement);
    this.animateViewIn(<View>this.otaFeaturesView.nativeElement);

    if (!this.updating) {
      this.smartDriveOTAs.splice(0, this.smartDriveOTAs.length);
      this.pushTrackerOTAs.splice(0, this.pushTrackerOTAs.length);
      let ptFW = null;
      let bleFW = null;
      let mcuFW = null;
      // load firmware files here!
      this.loadFile('/assets/ota/PushTracker.15.ota')
        .then(otaData => {
          ptFW = otaData;
          return this.loadFile('/assets/ota/SmartDriveBluetooth.15.ota');
        })
        .then(otaData => {
          bleFW = otaData;
          return this.loadFile('/assets/ota/MX2+.15.ota');
        })
        .then(otaData => {
          mcuFW = otaData;
          console.log(`got MX2+ OTA, version: 0x${Number(mcuFW[0]).toString(16)}`);
          this._progressService.show('Searching for SmartDrives');
          return this.discoverSmartDrives();
        })
        .then(sds => {
          this._progressService.hide();
          return this.select(sds);
        })
        .then(selectedSmartDrives => {
          selectedSmartDrives.map(sd => {
            this.smartDriveOTAs.push(sd);
          });
          //this.smartDriveOTAs.notify(ObservableArray.changeEvent);
          return this.select(BluetoothService.PushTrackers); //.filter(pt => pt.connected));
        })
        .then(selectedPushTrackers => {
          selectedPushTrackers.map(pt => {
            this.pushTrackerOTAs.push(pt);
          });
          //this.pushTrackerOTAs.notify(ObservableArray.changeEvent);

          // OTA the selected smart drive(s)
          const smartDriveOTATasks = this.smartDriveOTAs.map(sd => {
            return sd.performOTA(bleFW, mcuFW, 0x15, 0x15, 300000);
          });

          const pushTrackerOTATasks = this.pushTrackerOTAs.map(pt => {
            return pt.performOTA(ptFW, 0x15, 300000, this._bluetoothService);
          });

          return Promise.all(smartDriveOTATasks.concat(pushTrackerOTATasks));
        })
        .then(otaStatuses => {
          console.log(`completed all otas with statuses: ${otaStatuses}`);
          this.updating = false;
        })
        .catch(err => {
          console.log(`Couldn't finish updating: ${err}`);
          this.updating = false;
        });
    }

    this.updating = true;
  }

  private loadFile(fileName: string): Promise<any> {
    const f = currentApp.getFile(fileName);
    return new Promise((resolve, reject) => {
      let data = null;
      const source = f.readSync(e => {
        console.log("couldn't read file:");
        console.log(e);
        reject();
      });
      if (isIOS) {
        const arr = new ArrayBuffer(source.length);
        source.getBytes(arr);
        data = new Uint8Array(arr);
      } else if (isAndroid) {
        data = new Uint8Array(source);
      }
      resolve(data);
    });
  }
}

/*
  setTimeout(() => {
  this.routerExtensions.navigate(['/pairing'], {
  clearHistory: true
  });
  }, 1500);
  }
  }
  }, 500);
*/
