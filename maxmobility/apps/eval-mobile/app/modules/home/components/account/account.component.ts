// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { confirm } from 'tns-core-modules/ui/dialogs';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
// // app
// import { Config } from '../../shared/config';
// import { User } from '../../shared/user';

@Component({
  selector: 'Account',
  moduleId: module.id,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  /**
   * Use the @ViewChild decorator to get a reference to the drawer component.
   * It is used in the "onDrawerButtonTap" function below to manipulate the drawer.
   */

  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  // user = new User();

  // private members
  private _sideDrawerTransition: DrawerTransitionBase;

  constructor() {
    // this.user = Config.user;
  }

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

  onSaveAccountTap() {
    confirm({
      title: 'Update User Account?',
      message: 'Send these settings to the Server?',
      okButtonText: 'Yes',
      cancelButtonText: 'No'
    });
  }

  onChangePasswordTap() {
    confirm({
      title: 'Change Password?',
      message: 'Are you sure you want to change your password?',
      okButtonText: 'Yes',
      cancelButtonText: 'No'
    });
  }

  onResetAccountTap() {
    confirm({
      title: 'Reset Account?',
      message: 'Are you sure you want to reset your account (remove all your data / settings)?',
      okButtonText: 'Yes',
      cancelButtonText: 'No'
    });
  }
}
