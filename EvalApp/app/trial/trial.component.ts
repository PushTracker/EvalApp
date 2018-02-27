import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";
import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { TextField } from "ui/text-field";

import * as switchModule from "tns-core-modules/ui/switch";

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
            Label: "Trial Set-up",
            Description: "Select options and settings for SmartDrive trial."
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

    trialName: string = "";

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
    onTextChange(args) {
        const textField = <TextField>args.object;

        console.log("onTextChange");
        this.trialName = textField.text;
    }

    onReturn(args) {
        const textField = <TextField>args.object;

        console.log("onReturn");
        this.trialName = textField.text;
    }

    showAlert(result) {
        alert("Text: " + result);
    }

    submit(result) {
        alert("Text: " + result);
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
