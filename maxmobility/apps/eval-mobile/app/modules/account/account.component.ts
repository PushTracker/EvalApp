// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { confirm } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
// app
import { UserService, ProgressService, LoggingService } from '@maxmobility/mobile';
import { User, CLog } from '@maxmobility/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'Account',
  moduleId: module.id,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  constructor(
    private _userService: UserService,
    private _progressService: ProgressService,
    private _loggingService: LoggingService,
    private _router: RouterExtensions,
    private _page: Page,
    private _translateService: TranslateService
  ) {
    this._page.enableSwipeBackNavigation = false;
  }

  // tslint:disable-next-line:member-ordering
  user: Kinvey.User = this._userService.user;

  yes: string = this._translateService.instant('dialogs.yes');
  no: string = this._translateService.instant('dialogs.no');
  success: string = this._translateService.instant('user.success');
  ok: string = this._translateService.instant('dialogs.ok');
  account_update: string = this._translateService.instant('user.account-update');
  account_update_confirm: string = this._translateService.instant('user.account-update-confirm');
  account_update_complete: string = this._translateService.instant('user.account-update-complete');
  account_reset: string = this._translateService.instant('user.account-reset');
  account_reset_confirm: string = this._translateService.instant('user.account-reset-confirm');
  password_change: string = this._translateService.instant('user.password-change');
  password_change_confirm: string = this._translateService.instant('user.password-change-confirm');
  // tslint:disable-next-line:member-ordering
  sign_out: string = this._translateService.instant('user.sign-out');
  sign_out_confirm: string = this._translateService.instant('user.sign-out-confirm');

  ngOnInit() {}

  onDrawerButtonTap() {
    this._router.navigate(['/home'], {
      transition: {
        name: 'slideBottom',
        duration: 350,
        curve: 'easeInOut',
        clearHistory: true
      }
    });
  }

  onSaveAccountTap() {
    confirm({
      title: this.account_update,
      message: this.account_update_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
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
            alert({ title: this.success, message: this.account_update_complete, okButtonText: this.ok });
          })
          .catch(err => {
            this._loggingService.logException(err);
          });
      }
    });
  }

  onChangePasswordTap() {
    confirm({
      title: this.password_change,
      message: this.password_change_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
    });
  }

  onResetAccountTap() {
    confirm({
      title: this.account_reset,
      message: this.account_reset_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
    });
  }

  /**
   * Confirm with user to sign out. If confirmed, sign out, then nav to login.
   */
  onSignOutTap() {
    confirm({
      title: this.sign_out,
      message: this.sign_out_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
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

  onDebugMenuTap() {
    this._router.navigate(['/settings']);
  }
}
