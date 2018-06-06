// angular
import { Component, OnInit } from '@angular/core';
// nativescript
import { RouterExtensions } from 'nativescript-angular/router';
import { Page } from 'tns-core-modules/ui/page';
import { alert } from 'tns-core-modules/ui/dialogs';
// app
import { User, LoggingService, CLog } from '@maxmobility/core';
import { UserService, ProgressService, preventKeyboardFromShowing } from '@maxmobility/mobile';
import { validate } from 'email-validator';
import { TranslateService } from '@ngx-translate/core';
import { device } from 'tns-core-modules/platform';

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
    private _translateService: TranslateService
  ) {
    preventKeyboardFromShowing();
  }

  error_1: string = this._translateService.instant('user.error-1');
  error_2: string = this._translateService.instant('user.error-2');
  error: string = this._translateService.instant('user.error');
  ok: string = this._translateService.instant('user.ok');
  signing_in: string = this._translateService.instant('user.signing-in');
  success: string = this._translateService.instant('user.success');
  password_error: string = this._translateService.instant('user.password-error');
  email_error: string = this._translateService.instant('user.email-error');
  check_email: string = this._translateService.instant('user.check-email');
  email_required: string = this._translateService.instant('user.email-required');

  ngOnInit(): void {
    CLog('LoginComponent OnInit');
    this._page.actionBarHidden = true;
    this._page.backgroundSpanUnderStatusBar = true;

    // if we get to the login page, no user should be logged in
    CLog(
      'LoginComponent ngOnInit ',
      'Logging out any active user. Login screen should only be used when no user is authenticated.'
    );
    this._userService.logout();
  }

  onSubmitTap() {


    // validate the email
    const isEmailValid = this._isEmailValid(this.user.email);
    if (!isEmailValid) {
      return;
    }

    const isPasswordValid = this._isPasswordValid(this.user.password);
    if (!isPasswordValid) {
      return;
    }

    this._progressService.show(this.signing_in);

    // now try logging in with Kinvey user account
    this._userService
      .login(this.user.email, this.user.password)
      .then(res => {
        CLog('login res', res);
        this._progressService.hide();
        this._routerExtensions.navigate(['/home'], {
          clearHistory: true
        });
      })
      .catch(err => {
        CLog('login error', err);
        this._progressService.hide();
        // parse the exceptions from kinvey sign up
        let errorMessage = this.error_1;
        if (err.toString().includes('InvalidCredentialsError')) {
          errorMessage = this.error_2;
        }
        alert({
          title: this.error,
          message: errorMessage,
          okButtonText: this.ok
        });
        this._logService.logException(err);
      });
  }

  navToForgotPassword() {
     this._routerExtensions.navigate(['/forgot-password'],
       {
        transition: {
          name: 'slideLeft'
       }
     }
    );
  }

  

  onEmailTextChange(args) {
    this._isEmailValid(this.user.email);
  }

  navToSignUp() {
    this._routerExtensions.navigate(['/sign-up'],
        {
          transition: {
            name: 'slideLeft'
        }
      }
     );
  }

  private _isEmailValid(text: string): boolean {
    // validate the email
    CLog('isEmailValid', text);

    if (!text) {
      this.emailError = this.email_required;
      return false;
    }
    // make sure it's a valid email
    const email = text.trim();
    if (!validate(email)) {
      this.emailError = `"${email}" ` + this.email_error;
      return false;
    }

    this.emailError = '';
    return true;
  }

  private _isPasswordValid(text: string): boolean {
    // validate the password

    if (!text) {
      this.passwordError = this.password_error;
      return false;
    }
    this.passwordError = '';
    return true;
  }
}
