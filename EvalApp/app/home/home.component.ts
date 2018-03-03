import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

import { EventData } from "data/observable";
import { topmost } from "ui/frame";
import { isIOS } from "platform";

import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

    /* ***********************************************************
    * Use the @ViewChild decorator to get a reference to the drawer component.
    * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
    *************************************************************/
    @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;

    titles = [
        { Title: "Intro", Image: String.fromCharCode(0xf05a), Description: "Learn about SmartDrive", Route: "/home" },
        // tslint:disable-next-line:max-line-length
        { Title: "Videos", Image: String.fromCharCode(0xf008), Description: "Training videos and Lessons", Route: "/videos" },
        // tslint:disable-next-line:max-line-length
        { Title: "Eval", Image: String.fromCharCode(0xf0ae), Description: "Walk-through evaluation and generate an LMN", Route: "/evalEntry" },
        { Title: "OTA", Image: String.fromCharCode(0xf019), Description: "Over the Air Firmware Updates", Route: "/ota" },
        // tslint:disable-next-line:max-line-length
        { Title: "Demos", Image: String.fromCharCode(0xf02a), Description: "Fleet management and Tracking.", Route: "/demos" },
        { Title: "FAQ", Image: String.fromCharCode(0xf059), Description: "Common SmartDrive Questions", Route: "/faq" }
    ];

    private _sideDrawerTransition: DrawerTransitionBase;

    constructor(private routerExtensions: RouterExtensions) {
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

    onItemTapThirdList(args) {
        this.routerExtensions.navigate([this.titles[args.index].Route], {
            transition: {
                name: "slide"
            }
        });
    }

}
