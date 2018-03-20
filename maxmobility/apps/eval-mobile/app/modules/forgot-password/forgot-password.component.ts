// angular
import { Component, OnInit } from '@angular/core';
// nativescript
import { RouterExtensions } from 'nativescript-angular/router';
import { PropertyChangeData } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';
import { Color } from 'tns-core-modules/color';
import { TextField } from 'tns-core-modules/ui/text-field';
import { alert } from 'tns-core-modules/ui/dialogs';
// app
import { User, LoggingService, CLog } from '@maxmobility/core';
import { UserService, ProgressService, preventKeyboardFromShowing } from '@maxmobility/mobile';
import { validate } from 'email-validator';

@Component({
  selector: 'forgot-password',
  moduleId: module.id,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  email = '';
  emailError = '';

  constructor(
    private _routerExtensions: RouterExtensions,
    private _logService: LoggingService,
    private _progressService: ProgressService,
    private _userService: UserService,
    private _page: Page
  ) {
    preventKeyboardFromShowing();
  }

  ngOnInit(): void {
    CLog('ForgotPasswordComponent OnInit');
    this._page.actionBarHidden = false;
    this._page.actionBar.visibility = 'visible';
  }

  goBack() {
    if (this._routerExtensions.canGoBack()) {
      this._routerExtensions.back();
    } else {
      this._routerExtensions.navigate(['/login']);
    }
  }

  onSubmitTap() {
    // validate the email
    if (!this.email) {
      this.emailError = 'Email is required.';
      return;
    }
    // make sure it's a valid email
    const em = this.email.trim();
    if (!validate(em)) {
      this.emailError = `${em} is not a valid email address!`;
      return;
    }

    this.emailError = '';

    this._progressService.show('Submitting...');

    this._userService
      .resetPassword(this.email)
      .then(resp => {
        CLog('resp', resp);
        this._progressService.hide();
        alert({
          title: 'Success',
          message: 'Check your email for instructions on resetting your password.',
          okButtonText: 'Okay'
        }).then(() => {
          this._routerExtensions.navigate(['/login']);
        });
      })
      .catch(err => {
        this._logService.logException(err);
        this._progressService.hide();
        alert({
          title: 'Error',
          message: 'An error occurred trying to retrieve your account information. Try again later.',
          okButtonText: 'Okay'
        });
      });
  }

  onEmailTextChange(args: PropertyChangeData) {
    CLog('args', args.value);
    // make sure it's a valid email
    const em = this.email.trim();
    this.emailError = !validate(em) ? `${em} is not a valid email address!` : '';
  }
}
