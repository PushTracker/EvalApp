import { Component, OnInit, ViewChild } from "@angular/core";

import { confirm } from "ui/dialogs";

import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "Summary",
    moduleId: module.id,
    templateUrl: "./summary.component.html",
    styleUrls: ["./summary.component.css"]
})
export class SummaryComponent implements OnInit {
    // private members

    constructor(private routerExtensions: RouterExtensions) {
    }

    // button events
    public onNext(): void {
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

    public onBack(): void {
        this.routerExtensions.navigate(["/trial"], {
            transition: {
                name: "slideRight"
            }
        });
    }

    /* ***********************************************************
    * Use the sideDrawerTransition property to change the open/close animation of the drawer.
    *************************************************************/
    ngOnInit(): void {
    }
}
