import application = require("application");

import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { ListPicker } from "ui/list-picker";

import { Observable } from "data/observable";
import { confirm } from "ui/dialogs";

import { EvaluationService } from "../shared/evaluation.service";

import { RouterExtensions } from "nativescript-angular/router";

const timeInChair = ["1", "2", "3", "4", "5+",
    "10+", "20+", "30+"];

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

    yesNo: Array<SegmentedBarItem> = [];
    PushingPain: Array<SegmentedBarItem> = [];
    PushingFatigue: Array<SegmentedBarItem> = [];

    isIOS: boolean = false;
    isAndroid: boolean = false;

    timeFrames: Array<string>;
    picked: string;

    // private members
    private _sideDrawerTransition: DrawerTransitionBase;
    private pains = ["Yes", "No"];
    private fatigues = ["Yes", "No"];

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

        this.timeFrames = [];

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < timeInChair.length; i++) {
            this.timeFrames.push(timeInChair[i]);
        }
    }

    onSliderUpdate(key, args) {
        this.settings.set(key, args.object.value);
    }

    // button events
    onNext(): void {
        this.routerExtensions.navigate(["/training"], {
	    clearHistory: true,
            transition: {
                name: "slide"
            }
        });
    }

    // listPicker events
    selectedIndexChanged(args) {
        const picker = <ListPicker>args.object;
        console.log("picker selection: " + picker.selectedIndex);

        this.picked = this.timeFrames[picker.selectedIndex];
    }

    // pushing pain
    getPushingPainIndex(): number {
        return this.pains.indexOf(this.settings.get("PushingPain"));
    }

    onPushingPainIndexChange(args): void {
        const segmentedBar = <SegmentedBar>args.object;
        this.settings.set("PushingPain", this.pains[segmentedBar.selectedIndex]);
    }

    // pushing fatigue
    getPushingFatigueIndex(): number {
        return this.fatigues.indexOf(this.settings.get("PushingFatigue"));
    }

    onPushingFatigueIndexChange(args): void {
        const segmentedBar = <SegmentedBar>args.object;
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
