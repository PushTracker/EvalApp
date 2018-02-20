import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

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
        {Title: "Intro", Image: "&#xf05a;", Description: "Learn about SmartDrive"},
        {Title: "Videos", Image: "&#xf008;", Description: "Training videos and Lessons"},
        {Title: "Eval", Image: "&#xf0ae;", Description: "Walk through an evaluation and generate an LMN."},
        {Title: "OTA", Image: "&#xf019;", Description: "Over the Air Firmware Updates"},
        {Title: "Demos", Image: "&#xf02a;", Description: "Fleet management and Tracking."},
        {Title: "FAQ", Image: "&#xf059;", Description: "Common SmartDrive Questions"}
    ];

    private _sideDrawerTransition: DrawerTransitionBase;

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
        console.log(args.index);
    }
}
