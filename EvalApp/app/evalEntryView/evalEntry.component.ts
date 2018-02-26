import application = require("application");

import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { Observable } from "data/observable";
import { confirm } from "ui/dialogs";

import { EvaluationService } from "../shared/evaluation.service";

import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "EvalEntry",
    moduleId: module.id,
    templateUrl: "./evalEntry.component.html",
    styleUrls: ["./evalEntry.component.css"]
})
export class EvalEntryComponent implements OnInit {
    /* ***********************************************************
    * Use the @ViewChild decorator to get a reference to the drawer component.
    * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
    *************************************************************/
    @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;

    public yesNo: Array<SegmentedBarItem> = [];
    public PushingPain: Array<SegmentedBarItem> = [];
    public PushingFatigue: Array<SegmentedBarItem> = [];

    public isIOS: boolean = false;
    public isAndroid: boolean = false;
    
    // private members
    private _sideDrawerTransition: DrawerTransitionBase;
    private pains = [ "Yes", "No" ];
    private fatigues = [ "Yes", "No" ];

    constructor(private routerExtensions: RouterExtensions) {
	this.pains.map((o) => {
	    const item = new SegmentedBarItem();
	    item.title = o;
	    this.PushingPain.push(item);
	});
	this.fatigues.map((o) => {
	    const item = new SegmentedBarItem();
	    item.title = o;
	    this.PushingFatigue.push(item);
	});
    }

    public onSliderUpdate(key, args) {
	this.settings.set(key, args.object.value);
    }

    // button events
    public onNext(): void {
        this.routerExtensions.navigate(["/training"], {
            transition: {
                name: "slide"
            }
        });
    }

    // pushing pain
    public getPushingPainIndex(): number {
	return this.pains.indexOf(this.settings.get("PushingPain"));
    }

    public onPushingPainIndexChange(args): void {
	let segmentedBar = <SegmentedBar>args.object;
	this.settings.set("PushingPain", this.pains[segmentedBar.selectedIndex]);
    }

    // pushing fatigue
    public getPushingFatigueIndex(): number {
	return this.fatigues.indexOf(this.settings.get("PushingFatigue"));
    }

    public onPushingFatigueIndexChange(args): void {
	let segmentedBar = <SegmentedBar>args.object;
	this.settings.set("PushingFatigue", this.fatigues[segmentedBar.selectedIndex]);
    }

    /* ***********************************************************
    * Use the sideDrawerTransition property to change the open/close animation of the drawer.
    *************************************************************/
    ngOnInit(): void {
        this._sideDrawerTransition = new SlideInOnTopTransition();
	if (application.ios) {
	    this.isIOS = true;
	} else if (application.android) {
	    this.isAndroid = true;
	}
    }

    get sideDrawerTransition(): DrawerTransitionBase {
        return this._sideDrawerTransition;
    }

    get settings(): Observable {
	return EvaluationService.settings;
    }

    /* ***********************************************************
    * According to guidelines, if you have a drawer on your page, you should always
    * have a button that opens it. Use the showDrawer() function to open the app drawer section.
    *************************************************************/
    onDrawerButtonTap(): void {
        this.drawerComponent.sideDrawer.showDrawer();
    }
}
