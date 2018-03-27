// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

@Component({
  selector: 'Browse',
  moduleId: module.id,
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.css']
})
export class BrowseComponent implements OnInit {
  videos = [
    { Title: 'Lesson 1', Image: '&#xf05a;', Description: 'SmartDrive MX2+ Overview' },
    { Title: 'Lesson 2', Image: '&#xf008;', Description: 'How to do a proper tap gesture' },
    { Title: 'Lesson 3', Image: '&#xf0ae;', Description: 'How to do a Smart Drive Eval' },
    { Title: 'Lesson 4', Image: '&#xf019;', Description: 'How to do Over the Air Firmware Updates' },
    { Title: 'Lesson 5', Image: '&#xf02a;', Description: 'How to adjust setings' },
    { Title: 'Lesson 6', Image: '&#xf059;', Description: 'PushTracker Overview' }
  ];

  // tslint:disable-next-line:max-line-length
  videoHtmlString = '<iframe src="https://www.youtube.com/embed/6_M1J8HZXIk" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  private _sideDrawerTransition: DrawerTransitionBase;

  /************************************************************
   * Use the sideDrawerTransition property to change the open/close animation of the drawer.
   *************************************************************/
  ngOnInit(): void {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  /************************************************************
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
