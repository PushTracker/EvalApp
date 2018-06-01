import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

import { BluetoothService, ProgressService } from '@maxmobility/mobile';

@Component({
  selector: 'Settings',
  moduleId: module.id,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private _bluetoothService: BluetoothService, private _progressService: ProgressService) {}

  /************************************************************
   * Use the sideDrawerTransition property to change the open/close animation of the drawer.
   *************************************************************/
  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
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

  onStopBT(): void {
    this._progressService.show('Stopping Bluetooth service');
    const stopProgress = result => {
      console.log(`RESULT: ${result}`);
      setTimeout(() => {
        this._progressService.hide();
      }, 1000);
    };
    this._bluetoothService
      .stop()
      .then(stopProgress)
      .catch(err => {
        console.log(`Couldn't stop BT: ${err}`);
        stopProgress(err);
      });
  }

  onRestartBT(): void {
    this._progressService.show('Restarting Bluetooth service');
    const stopProgress = result => {
      console.log(`RESULT: ${result}`);
      setTimeout(() => {
        this._progressService.hide();
      }, 1000);
    };
    this._bluetoothService
      .advertise()
      .then(stopProgress)
      .catch(err => {
        console.log(`Couldn't restart BT: ${err}`);
        stopProgress(err);
      });
  }
}
