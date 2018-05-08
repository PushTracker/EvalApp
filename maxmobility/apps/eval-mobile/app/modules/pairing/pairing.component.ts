// angular
import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
import { Observable, EventData } from 'tns-core-modules/data/observable';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { GridLayout } from 'tns-core-modules/ui/layouts/grid-layout';
import { Color } from 'tns-core-modules/color';
import { Image } from 'tns-core-modules/ui/image';
import { Label } from 'tns-core-modules/ui/label';
import { AnimationCurve } from 'tns-core-modules/ui/enums';
import { View } from 'tns-core-modules/ui/core/view';
import { Animation, AnimationDefinition } from 'tns-core-modules/ui/animation';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { RouterExtensions } from 'nativescript-angular/router';
// import { Observable, Scheduler } from "rxjs";

// libs
import { CLog } from '@maxmobility/mobile';
import { BluetoothService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';

const carousel = require('nativescript-carousel').Carousel;

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css']
})
export class PairingComponent implements OnInit, AfterViewInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  @ViewChild('carousel') carousel: ElementRef;
  private feedback: Feedback;
  snackbar = new SnackBar();

  slides = [
    {
      Image: '~/assets/images/PushTracker-pairing.png',
      Label: 'Pairing Your PushTracker to the App',
      Bullets: [
        'Press and hold the right flat button on your PushTracker for three seconds to enter the settings menu',
        'Press the right button to scroll to the phone/PT icon.',
        'Press the left raised button to innitiate pairing.'
      ]
    },
    {
      Image: '~/assets/images/PushTracker-Connecting.png',
      Label: 'Connecting your PushTracker to the App',
      Bullets: [
        'With the PushTrtacker app open, press the right flat button on the PushTracker',
        'You will see a "Success" notification in the app.'
      ]
    },
    {
      Image: '~/assets/images/PushTracker-SmartDrive-pairing.png',
      Label: 'Tap Gesture',
      Bullets: [
        'Press and hold the right flat button on your PushTracker for three seconds to enter the settings menu',
        'Press the right button to scroll to the PT-SD icon.',
        'Press the left raised button to innitiate pairing your PushTracker to your SmartDrive.'
      ]
    }
  ];

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private routerExtensions: RouterExtensions, private _bluetoothService: BluetoothService) {
    this.feedback = new Feedback();
  }

  //Connectivity Events
  pushTrackerPairingSuccess() {
    this.feedback.success({
      title: 'Success!',
      message: 'Successfully paired with PushTracker!',
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => {
        console.log('showSuccess tapped');
      }
    });
  }

  pushTrackerConnectionSuccess() {
    this.feedback.success({
      title: 'Success!',
      message: 'Successfully connected with PushTracker!',
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => {
        console.log('showSuccess tapped');
      }
    });
  }

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/trial'], {
      clearHistory: true,
      transition: {
        name: 'wipe'
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.snackbar.simple('Swipe left to view more slides.');
    }, 1000);
  }

  onBack(): void {
    this.routerExtensions.navigate(['/eval-entry'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideInOnTopTransition();

    // TODO: cases we need to handle:
    //  - a new pushtracker we haven't seen pairs
    //  - a previously paired / connected pushtracker re-pairs

    // handle pushtracker pairing events for existing pushtrackers
    console.log('registering for pairing events!');
    BluetoothService.PushTrackers.map(pt => {
      console.log(pt);
      pt.on(PushTracker.pushtracker_paired_event, args => {
        console.log(`PT PAIRED EVENT!`);
        this.pushTrackerPairingSuccess(null);
        pt.on(PushTracker.pushtracker_connect_event, args => {
          this.pushTrackerConnectionSuccess();
        });
      });
    });
    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        console.log(`PT ADDED EVENT!`);
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        if (pt) {
          pt.on(PushTracker.pushtracker_paired_event, args => {
            console.log(`PT PAIRED EVENT!`);
            this.pushTrackerPairingSuccess();
            pt.on(PushTracker.pushtracker_connect_event, args => {
              this.pushTrackerConnectionSuccess();
            });
          });
        }
      }
    });
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
