import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

import { Progress } from "ui/progress";

import { HttpClient } from "@angular/common/http";
import { Color } from "tns-core-modules/color/color";

@Component({
    selector: "Featured",
    moduleId: module.id,
    templateUrl: "./featured.component.html",
    styleUrls: ["./ota.component.css"]
})
export class FeaturedComponent implements OnInit {
    /* ***********************************************************
    * Use the @ViewChild decorator to get a reference to the drawer component.
    * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
    *************************************************************/
    @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;

    sdBtProgressValue: number;
    sdMpProgressValue: number;
    ptBtProgressValue: number;

    private _sideDrawerTransition: DrawerTransitionBase;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this._sideDrawerTransition = new SlideInOnTopTransition();

        this.sdBtProgressValue = 0;
        this.sdMpProgressValue = 0;
        this.ptBtProgressValue = 0;

        setInterval(() => {
            this.sdBtProgressValue += 1;
            this.sdMpProgressValue += 5;
            this.ptBtProgressValue += 10;

            // this.onValueChanged(5);

        }, 2300);
    }

    onValueChanged(args) {
        const progressBar = <Progress>args.object;

        console.log("Value changed for " + progressBar);
        console.log("New value: " + progressBar.value);
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
