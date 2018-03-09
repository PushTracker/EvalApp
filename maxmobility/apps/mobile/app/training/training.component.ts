import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

import { RouterExtensions } from 'nativescript-angular/router';

@Component({
  selector: 'Training',
  moduleId: module.id,
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements OnInit {
  /************************************************************
   * Use the @ViewChild decorator to get a reference to the drawer component.
   * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
   *************************************************************/
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  slides = [
    {
      Image: '~/images/PowerOn.jpg',
      Label: 'Powering SmartDrive',
      Description: 'Press back on the rocker switch to power on the SmartDrive, and forward to power off.'
    },
    {
      Image: '~/images/BandPower.jpg',
      Label: 'Powering PushTracker',
      // tslint:disable-next-line:max-line-length
      Description:
        "Press the left raised button on the PushTracker to power on. Press and hold for 3 secconds to enter sleep mode 'zzz' and pwer off."
    },
    {
      Image: '~/images/Stop.jpg',
      Label: 'Tap Gesture',
      Description: 'Proper tapping technique.',
      // tslint:disable-next-line:max-line-length
      Bullet_1:
        'Keeping your wrist straight, make contact on the pushrim with the palm of your hand. A red light will alluminate upon succesful tap.',
      Bullet_2: "Tip: You don't need to make contact with the PushTracker band.",
      // tslint:disable-next-line:max-line-length
      Bullet_3: "Tip: Avoid moving your hand in a 'fishtail' like motion. This will lead to inconsistant tap recognition."
    },
    {
      Image: '~/images/Tapping.jpg',
      Label: 'Starting SmartDrive',
      Description: 'Starting & Setting Speed',
      // tslint:disable-next-line:max-line-length
      Bullet_1:
        'Keeping your wrist straight, make contact on the pushrim with the palm of your hand. A red light will alluminate upon succesful tap.',
      Bullet_2: 'Double-tap to initiate the SmartDrive. It will then begin to accelerate.',
      Bullet_3: 'Then, single-tap to set your desired speed.',
      Bullet_4: 'To increase speed, give a faster push and then single tap to set your desired speed.'
    },
    {
      Image: '~/images/Steer.jpg',
      Label: 'Steering',
      Description: 'To steer, gently grip the pushrim of the direction you want to go.',
      Bullet_1: 'Light grip will allow you to veer.',
      Bullet_2: 'Allow the pushrim to slide through your hands.'
    },
    {
      Image: '~/images/turn.jpg',
      Label: 'Turning',
      Description: 'To turn, firmly grip the pushrim of the direction you want to go.',
      Bullet_1: 'Firm grip will allow you to turn.',
      Bullet_2: 'The tighter you grip, the sharper you will turn.',
      // tslint:disable-next-line:max-line-length
      Bullet_3: 'Tip: An optimal center of gravity position of the reer wheels will reduce the grip needed to make sharp turns.'
    },
    {
      Image: '~/images/Stop.jpg',
      Label: 'Stopping',
      Description: 'Double-tap to disengage the SmartDrive.',
      Bullet_1: 'Then coast and break with your hands.',
      Bullet_2: 'Tip: To stop quickly, perform a single tap, then grip the pushrims. (needs work)'
    }
  ];

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private routerExtensions: RouterExtensions) {}

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/trial'], {
      clearHistory: true,
      transition: {
        name: 'slide'
      }
    });
  }

  onBack(): void {
    this.routerExtensions.navigate(['/evalEntry'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  /************************************************************
   * Use the sideDrawerTransition property to change the open/close animation of the drawer.
   *************************************************************/
  ngOnInit(): void {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  /************************************************************
   * According to guidelines, if you have a drawer on your page, you should always
   * have a button that opens it. Use the showDrawer() function to open the app drawer section.
   *************************************************************/
  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
