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
	Bullets: [
	    "Press back on the rocker switch to power on the SmartDrive, and forward to power off."
	]
    },
	{
	Image: "~/assets/images/Steer.jpg",
	Label: "Powering PushTracker",
	Bullets: [
	    "Press the left raised button on the PushTracker to power on.",
	    'Press and hold for 3 secconds to enter sleep mode "zzz" and pwer off.',
	]
    },
	{
	Image: "~/assets/images/PowerOn.jpg.jpg",
	Label: "Tap Gesture",
	Bullets: [
	    "Keeping your wrist straight, make contact on the pushrim with the palm of your hand.",
	    "A red light will alluminate upon succesful tap.",
	    "Tip: You do not need to make contact with the PushTracker band.",
	    "Tip: Avoid moving your hand in a 'fishtail' like motion. This will lead to inconsistant tap recognition."
	]
    },
	{
	Image: "~/assets/images/Tapping.jpg",
	Label: "Starting & Setting Speed",
	Bullets: [
	    "Double-tap to initiate the SmartDrive. It will then begin to accelerate.",
	    "Then, single-tap to set your desired speed.",
	    "To increase speed, give a faster push and then single tap to set your desired speed."
	]
    },
	{
	Image: "~/assets/images/Steer.jpg",
	Label: "Steering",
	Bullets: [
	    "To steer, gently grip the pushrim of the direction you want to go.",
	    "Light grip will allow you to veer.",
	    "Allow the pushrim to slide through your hands."
	]
    },
	{
	Image: "~/assets/images/turn.jpg",
	Label: "Turning",
	Bullets: [
	    "To turn, firmly grip the pushrim of the direction you want to go.",
	    "Firm grip will allow you to turn.",
	    "The tighter you grip, the sharper you will turn.",
	    "Tip: An optimal center of gravity position of the reer wheels will reduce the grip needed to make sharp turns."
	]
    },
	{
	Image: "~/assets/images/Stop.jpg",
	Label: "Stopping",
	Bullets: [
	    "Double-tap to disengage the SmartDrive.",
	    "Then coast and break with your hands.",
	    "Tip: To stop quickly, perform a single-tap followed by a quick combined tap and grab."
	]
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
