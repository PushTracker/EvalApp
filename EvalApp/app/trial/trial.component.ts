import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";
import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { TextField } from "ui/text-field";

import { confirm } from "ui/dialogs";

import * as switchModule from "tns-core-modules/ui/switch";

import { EvaluationService } from "../shared/evaluation.service";

import { Observable } from "data/observable";

import { RouterExtensions } from "nativescript-angular/router";

import { SnackBar, SnackBarOptions } from "nativescript-snackbar";

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
            Image: "~/images/controls-4.png",
            Label: "Trial Set-Up",
            Description: "Select options and settings for SmartDrive trial.",
            Key: "setUp"
        },
        {
            Image: "~/images/stopwatch.jpg",
            Label: "Phase 1",
            Label_2: "With SmartDrive",
            Description: "Please enter a name for the trial and press Start to begin.",
            Key: "start"
        },
        {
            Image: "~/images/stopwatch.jpg",
            Label: "Phase 2",
            Label_2: "Without SmartDrive",
            Description: "Now perform the same course without Smart Drive.",
            Key: "end"
        },
        {
            Image: "~/images/checked-1.png",
            Label: "Trial Complete",
            Description: "Nice work!",
            Key: "summary"
        }
    ];

    trialName: string = "";

    snackbar = new SnackBar();

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

    // tslint:disable-next-line:adjacent-overload-signatures
    onStartTrial() {

        const options: SnackBarOptions = {
            actionText: "Connect",
            snackText: "Please connect to SmartDrive",
            hideDelay: 10000
          };

        this.snackbar.action(options).then((args) => {
            if (args.command === "Action") {
                confirm({
                    title: "Connecting...",
                    message: "Please make sure SmartDrive is on.",
                    okButtonText: "It Is",
                    cancelButtonText: "Whoops"
                })
                .then((result) => {
                    if (result) {
                        // tslint:disable-next-line:no-shadowed-variable
                        this.snackbar.simple("Connecting to SmartDrive.", "red", "#fff").then((args) => {
                        // connect()
                      });
                    } else {
                        // tslint:disable-next-line:no-shadowed-variable
                        this.snackbar.simple("Connecting to SmartDrive", "red", "#fff").then((args) => {
                            // connect()
                          });
                      }
                });
            } else {
              // dismiss
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

    onSliderUpdate(key, args) {
        this.settings.set(key, args.object.value);
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
