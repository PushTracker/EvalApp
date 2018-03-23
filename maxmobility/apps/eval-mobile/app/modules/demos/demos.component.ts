import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

@Component({
  selector: 'Demos',
  moduleId: module.id,
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  demos = [
    { SerialNumber: '11000', LastUsed: new Date(1988, 10, 23), Location: 'Mountain View, CA' },
    { SerialNumber: '11001', LastUsed: new Date(), Location: 'Nashville, TN' },
    { SerialNumber: '11002', LastUsed: new Date(), Location: 'Breckenridge, CO' },
    { SerialNumber: '11003', LastUsed: new Date(), Location: 'Seattle, WA' },
    { SerialNumber: '11004', LastUsed: new Date(), Location: 'San Francisco, CA' },
    { SerialNumber: '11005', LastUsed: new Date(), Location: 'Los Angeles, CA' },
    { SerialNumber: '11006', LastUsed: new Date(), Location: 'New Orleans, LA' },
    { SerialNumber: '11007', LastUsed: new Date(), Location: 'New York, NY' }
  ];

  private _sideDrawerTransition: DrawerTransitionBase;

  onDemoTap(args) {
    console.log('onDemoTap');
  }

  ngOnInit() {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
