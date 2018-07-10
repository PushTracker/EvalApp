import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { PageRoute, RouterExtensions } from 'nativescript-angular/router';
import { switchMap } from 'rxjs/operators';
import { View } from 'ui/core/view';
import { Color } from 'tns-core-modules/color';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { BluetoothService } from '@maxmobility/mobile';
import { PushTracker } from '@maxmobility/core';
const Carousel = require('nativescript-carousel').Carousel;

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css']
})
export class PairingComponent implements AfterViewInit {
  @ViewChild('carousel') carousel: ElementRef;
  snackbar = new SnackBar();
  selectedPage = 0;

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

  private feedback: Feedback;

  constructor(
    private pageRoute: PageRoute,
    private routerExtensions: RouterExtensions,
    private _bluetoothService: BluetoothService
  ) {
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
            console.log('pairedArgs', pairedArgs);
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

  // Connectivity Events
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
      // clearHistory: true,
      transition: {
        name: 'wipe'
      }
    });
  }

  onCarouselLoad() {
    setTimeout(() => {
      this.carousel.nativeElement.selectedPage = this.selectedPage;
      this.carousel.nativeElement.refresh();
      console.log('Carousel loaded to ' + this.selectedPage);
    }, 100);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.snackbar.simple('Swipe left to view more slides.');
    }, 1000);
  }

  onBack(): void {
    this.routerExtensions.navigate(['/eval-entry'], {
      // clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  onNavButtonTap(): void {
    this.routerExtensions.navigate(['/home'], {
      // clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }
}
