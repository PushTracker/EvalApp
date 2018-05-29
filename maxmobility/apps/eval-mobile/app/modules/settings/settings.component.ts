import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

import { BluetoothService } from '@maxmobility/mobile';

@Component({
  selector: 'Settings',
  moduleId: module.id,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private _bluetoothService: BluetoothService) {}

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

  onRestartBT(): void {
    this._bluetoothService.advertise();
  }
}
