import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";
import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "Trial",
    moduleId: module.id,
    templateUrl: "./trial.component.html",
    styleUrls: ["./trial.component.css"]
})
export class TrialComponent implements OnInit {
    /* ***********************************************************
    * Use the @ViewChild decorator to get a reference to the drawer component.
    * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
    *************************************************************/
    @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;

    slides = [
        {
            Image: "~/images/stopwatch.jpg",
            Label: "Flat Surface",
            Description: "User will push 300 meters without SmartDrive."
        },
        {
            Image: "~/images/stopwatch.jpg",
            Label: "Ramp",
            Description: "User will push up a ramp."
        },
        {
            Image: "~/images/stopwatch.jpg",
            Label: "Carpet",
            Description: "Fill in:."
        },
        {
            Image: "~/images/stopwatch.jpg",
            Label: "Other",
            Description: "Fill in:."
        }
    ];

    private _sideDrawerTransition: DrawerTransitionBase;

    constructor(private routerExtensions: RouterExtensions) {
    }

    // button events
    onNext(): void {
        this.routerExtensions.navigate(["/summary"], {
            transition: {
                name: "slide"
            }
        });
    }

    onBack(): void {
        this.routerExtensions.navigate(["/training"], {
            transition: {
                name: "slideRight"
            }
        });
    }

    /* ***********************************************************
    * Use the sideDrawerTransition property to change the open/close animation of the drawer.
    *************************************************************/
    ngOnInit(): void {
        this._sideDrawerTransition = new SlideInOnTopTransition();
    }

    get sideDrawerTransition(): DrawerTransitionBase {
        return this._sideDrawerTransition;
    }

    /* ***********************************************************
    * According to guidelines, if you have a drawer on your page, you should always
    * have a button that opens it. Use the showDrawer() function to open the app drawer section.
    *************************************************************/
    onDrawerButtonTap(): void {
        this.drawerComponent.sideDrawer.showDrawer();
    }
}
