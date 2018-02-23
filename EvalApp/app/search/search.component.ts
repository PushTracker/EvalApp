import { Component, OnInit, ViewChild } from "@angular/core";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-pro-ui/sidedrawer";
import { RadSideDrawerComponent } from "nativescript-pro-ui/sidedrawer/angular";

@Component({
    selector: "Search",
    moduleId: module.id,
    templateUrl: "./search.component.html",
    styles: [`

      Image {
        display: block;
        margin-left: auto;
        margin-right: auto;
        width: 50%;
        height: auto;
    }


      .slide-indicator-inactive{
          background-color: #fff;
          opacity : 0.4;
          width : 10;
          height : 10;
          margin-left : 2.5;
          margin-right : 2.5;
          margin-top : 0;
          border-radius : 5;
      }

      .slide-indicator-active{
          background-color: #fff;
          opacity : 0.9;
          width : 10;
          height : 10;
          margin-left : 2.5;
          margin-right : 2.5;
          margin-top : 0;
          border-radius : 5;
      }

    `]
})
export class SearchComponent implements OnInit {
    /* ***********************************************************
    * Use the @ViewChild decorator to get a reference to the drawer component.
    * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
    *************************************************************/
    @ViewChild("drawer") drawerComponent: RadSideDrawerComponent;

    public slides = [
	{
	"Image": "~/images/PowerOn.jpg",
    },
	{
	"Image": "~/images/BandPower.jpg",
    },
	{
	"Image": "~/images/Tapping.jpg",
    },
	{
	"Image": "~/images/Steer.jpg",
    },
	{
	"Image": "~/images/turn.jpg",
    },
	{
	"Image": "~/images/Stop.jpg",
    },
	{
	"Image": "~/images/Stop2.jpg",
    },
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
}
