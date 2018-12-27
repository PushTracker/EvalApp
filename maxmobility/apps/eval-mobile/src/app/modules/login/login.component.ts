import { Component, NgZone, OnInit } from '@angular/core';
import {
  LoggingService,
  preventKeyboardFromShowing,
  ProgressService,
  UserService
} from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { validate } from 'email-validator';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import { alert } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
import { setMarginForIosSafeArea } from '../../utils';

@Component({
  selector: 'Login',
  moduleId: module.id,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  user = { email: '', password: '' };
  passwordError = '';
  emailError = '';

  constructor(
    private _routerExtensions: RouterExtensions,
    private _logService: LoggingService,
    private _userService: UserService,
    private _progressService: ProgressService,
    private _page: Page,
    private _translateService: TranslateService,
    private _zone: NgZone
  ) {
    this._page.className = 'blue-gradient-down';
    preventKeyboardFromShowing();
  }

  ngOnInit(): void {
    this._page.actionBarHidden = true;
    this._page.backgroundSpanUnderStatusBar = true;
    setMarginForIosSafeArea(this._page);
    // if we get to the login page, no user should be logged in
    Kinvey.User.logout();
  }

  async onSubmitTap() {
    try {
      // validate the email
      const isEmailValid = this._isEmailValid(this.user.email);
      if (!isEmailValid) {
        return;
      }

      const isPasswordValid = this._isPasswordValid(this.user.password);
      if (!isPasswordValid) {
        return;
      }

      this._progressService.show(
        this._translateService.instant('user.signing-in')
      );

      // now try logging in with Kinvey user account
      await this._userService.login(this.user.email, this.user.password);
      this._progressService.hide();

      await this._userService._registerForPushNotifications();

      this._zone.run(() => {
        this._routerExtensions.navigate(['/home'], {
          clearHistory: true
        });
      });
    } catch (error) {
      this._progressService.hide();
      // parse the exceptions from kinvey sign up
      let errorMessage = this._translateService.instant('user.sign-in-error-1');
      if (error.toString().includes('InvalidCredentialsError')) {
        errorMessage = this._translateService.instant('user.sign-in-error-2');
      }
      alert({
        title: this._translateService.instant('user.error'),
        message: errorMessage,
        okButtonText: this._translateService.instant('dialogs.ok')
      });
      this._logService.logException(error);
    }
  }

  navToForgotPassword() {
    this._routerExtensions.navigate(['/forgot-password'], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  onEmailTextChange(args) {
    this.user.email = args.value;
    this._isEmailValid(this.user.email);
  }

  navToSignUp() {
    this._routerExtensions.navigate(['/sign-up'], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  private _isEmailValid(text: string): boolean {
    // validate the email
    if (!text) {
      this.emailError = this._translateService.instant('user.email-required');
      return false;
    }
    // make sure it's a valid email
    const email = text.trim();
    if (!validate(email)) {
      this.emailError = `"${email}" ${this._translateService.instant(
        'user.email-error'
      )}`;
      return false;
    }

    this.emailError = '';
    return true;
  }

  private _isPasswordValid(text: string): boolean {
    // validate the password
    if (!text) {
      this.passwordError = this._translateService.instant(
        'user.password-error'
      );
      return false;
    }
    this.passwordError = '';
    return true;
  }
}
