// angular
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
// nativescript
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-ui-sidedrawer";
import { RadSideDrawerComponent } from "nativescript-ui-sidedrawer/angular";
import { RouterExtensions } from "nativescript-angular/router";

@Component({
  selector: "Training",
  moduleId: module.id,
  templateUrl: "./training.component.html",
  styleUrls: ["./training.component.css"]
})
export class TrainingComponent implements OnInit {

  @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;

  slides = [
    {
      Image: "~/assets/images/",
      Label: "Powering SmartDrive",
      Bullet_1: "Press back on the rocker switch to power on the SmartDrive, and forward to power off."
    },
    {
      Image: "~/assets/images/Steer.jpg",
      Label: "Powering PushTracker",
      Bullet_1: "Press the left raised button on the PushTracker to power on.",
      Bullet_2: 'Press and hold for 3 secconds to enter sleep mode "zzz" and pwer off.'
    },
    {
      Image: "~/assets/images/PowerOn.jpg.jpg",
      Label: "Tap Gesture",
      Bullet_1: "Keeping your wrist straight, make contact on the pushrim with the palm of your hand.",
      Bullet_2: "A red light will alluminate upon succesful tap.",
      Bullet_3: "Tip: You do not need to make contact with the PushTracker band.",
      Bullet_4: "Tip: Avoid moving your hand in a 'fishtail' like motion. This will lead to inconsistant tap recognition."
    },
    {
      Image: "~/assets/images/Tapping.jpg",
      Label: "Starting & Setting Speed",
      Bullet_1: "Double-tap to initiate the SmartDrive. It will then begin to accelerate.",
      Bullet_2: "Then, single-tap to set your desired speed.",
      Bullet_3: "To increase speed, give a faster push and then single tap to set your desired speed."
    },
    {
      Image: "~/assets/images/Steer.jpg",
      Label: "Steering",
      Bullet_1: "To steer, gently grip the pushrim of the direction you want to go.",
      Bullet_2: "Light grip will allow you to veer.",
      Bullet_3: "Allow the pushrim to slide through your hands."
    },
    {
      Image: "~/assets/images/turn.jpg",
      Label: "Turning",
      Bullet_1: "To turn, firmly grip the pushrim of the direction you want to go.",
      Bullet_2: "Firm grip will allow you to turn.",
      Bullet_3: "The tighter you grip, the sharper you will turn.",
      Bullet_4: "Tip: An optimal center of gravity position of the reer wheels will reduce the grip needed to make sharp turns."
    },
    {
      Image: "~/assets/images/Stop.jpg",
      Label: "Stopping",
      Bullet_1: "Double-tap to disengage the SmartDrive.",
      Bullet_2: "Then coast and break with your hands.",
      Bullet_3: "Tip: To stop quickly, perform a single-tap followed by a quick combined tap and grab."
    }
  ];

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private routerExtensions: RouterExtensions) {}

  // button events
  onNext(): void {
    this.routerExtensions.navigate(["/trial"], {
      clearHistory: true,
      transition: {
        name: "wipe"
      }
    });
  }

  onBack(): void {
    this.routerExtensions.navigate(["/eval-entry"], {
      clearHistory: true,
      transition: {
        name: "slideRight"
      }
    });
  }

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
