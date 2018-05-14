// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { confirm } from 'tns-core-modules/ui/dialogs';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
// app
import { UserService, ProgressService, LoggingService } from '@maxmobility/mobile';
import { User, CLog } from '@maxmobility/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { Kinvey } from 'kinvey-nativescript-sdk';


@Component({
  selector: 'Account',
  moduleId: module.id,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  user: Kinvey.User = this._userService.user;

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(
    private _userService: UserService,
    private _progressService: ProgressService,
    private _loggingService: LoggingService,
    private _router: RouterExtensions
  ) {}

  ngOnInit() {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap() {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  onSaveAccountTap() {
    confirm({
      title: 'Update User Account?',
      message: 'Send these settings to the Server?',
      okButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then(result => {
      if (result) {
        this.user
          .update({
            email: (this.user.data as any).email,
            first_name: (this.user.data as any).first_name,
            last_name: (this.user.data as any).last_name
          })
          .then(resp => {
            CLog('update response', JSON.stringify(resp));
            alert({ title: 'Success', message: 'Your profile has been updated.', okButtonText: 'Okay' });
          })
          .catch(err => {
            this._loggingService.logException(err);
          });
      }
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

  /**
   * Confirm with user to sign out. If confirmed, sign out, then nav to login.
   */
  onSignOutTap() {
    confirm({
      title: 'Sign Out?',
      message: 'Are you sure you want to sign out?',
      okButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then(result => {
      CLog('signout confirm result', result);
      if (result) {
        this._userService
          .logout()
          .then(() => {
            this._router.navigate(['/login'], {
              clearHistory: true
            });
          })
          .catch(error => {
            this._loggingService.logException(error);
          });
      }
    });
  }
}
