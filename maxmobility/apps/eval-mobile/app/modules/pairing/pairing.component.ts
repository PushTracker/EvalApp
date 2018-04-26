// angular
import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from "@angular/core";
// nativescript
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-ui-sidedrawer";
import { RadSideDrawerComponent } from "nativescript-ui-sidedrawer/angular";
import { RouterExtensions } from "nativescript-angular/router";
import { View } from "ui/core/view";
import { Color } from "tns-core-modules/color";
import { Feedback, FeedbackType, FeedbackPosition } from "nativescript-feedback";
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';

const carousel = require('nativescript-carousel').Carousel;



@Component({
    selector: "Pairing",
    moduleId: module.id,
    templateUrl: "./pairing.component.html",
    styleUrls: ["./pairing.component.css"]
})
export class PairingComponent implements OnInit, AfterViewInit {

    @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;
    @ViewChild('carousel') carousel: ElementRef;
    private feedback: Feedback;
	snackbar = new SnackBar();

slides = [
    {
    Image: "~/assets/images/PushTracker-pairing.png",
    Label: "Pairing Your PushTracker to the App",
    Bullets: [
        "Press and hold the right flat button on your PushTracker for three seconds to enter the settings menu",
        "Press the right button to scroll to the phone/PT icon.",
        "Press the left raised button to innitiate pairing."
    ]
    },
    {
    Image: "~/assets/images/PushTracker-Connecting.png",
    Label: "Connecting your PushTracker to the App",
    Bullets: [
        "With the PushTrtacker app open, press the right flat button on the PushTracker",
        'You will see a "Success" notification in the app.'
    ]
    },
    {
    Image: "~/assets/images/PushTracker-SmartDrive-pairing.png",
    Label: "Tap Gesture",
    Bullets: [
        "Press and hold the right flat button on your PushTracker for three seconds to enter the settings menu", 
"Press the right button to scroll to the PT-SD icon.",
        "Press the left raised button to innitiate pairing your PushTracker to your SmartDrive."
        ]
    }
];

    private _sideDrawerTransition: DrawerTransitionBase;

    constructor(private routerExtensions: RouterExtensions) {

		this.feedback = new Feedback();
	}

	//Connectivity Events
	pushTrackerPairingSuccess(){

    this.feedback.success({
      title: "Success!",
      message: "Successfully paired with PushTracker!",
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => { console.log("showSuccess tapped"); }
    });

	}

	pushTrackerConnectionSuccess(){
	this.feedback.success({
      title: "Success!",
      message: "Successfully connected with PushTracker!",
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => { console.log("showSuccess tapped"); }
    });
		
	}


     


    // button events
    onNext(): void {
	this.routerExtensions.navigate(["/trial"], {
	    clearHistory: true,
	    transition: {
		name: "wipe"
	    }
	});
    }

	ngAfterViewInit(){

		setTimeout(() => {
	    this.snackbar.simple('Swipe left to view more slides.');
	}, 1000)

		
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
