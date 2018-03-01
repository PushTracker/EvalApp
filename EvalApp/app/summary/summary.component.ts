import { Component, OnInit, ViewChild } from "@angular/core";

import { SegmentedBar, SegmentedBarItem } from "ui/segmented-bar";

import { TextField } from "ui/text-field";

import { confirm } from "ui/dialogs";

import * as switchModule from "tns-core-modules/ui/switch";

import { EvaluationService } from "../shared/evaluation.service";

import { Observable } from "data/observable";

import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "Summary",
    moduleId: module.id,
    templateUrl: "./summary.component.html",
    styleUrls: ["./summary.component.css"]
})
export class SummaryComponent implements OnInit {

    // public members
    trialName: string = "";

    // private members

    constructor(private routerExtensions: RouterExtensions) {
    }

    // button events
    onNext(): void {
        confirm({
            title: "Complete Evaluation?",
            message: "Are you sure you're done with the evaluation?",
            okButtonText: "Yes",
            cancelButtonText: "No"
        })
            .then((result) => {
                if (result) {
                    this.routerExtensions.navigate(["/home"], {
                        clearHistory: true,
                        transition: {
                            name: "fade"
                        }
                    });
                }
            });
    }

    onBack(): void {
        this.routerExtensions.navigate(["/trial"], {
            clearHistory: true,
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

    onSliderUpdate(key, args) {
        this.settings.set(key, args.object.value);
    }

    /* ***********************************************************
     * Use the sideDrawerTransition property to change the open/close animation of the drawer.
     *************************************************************/
    ngOnInit(): void {
    }

    get settings(): Observable {
	return EvaluationService.settings;
    }
}
