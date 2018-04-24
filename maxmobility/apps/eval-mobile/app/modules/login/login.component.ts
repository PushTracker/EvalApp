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
    private _page: Page
  ) {
    preventKeyboardFromShowing();
  }

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

    this._progressService.show('Signing In...');

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
        let errorMessage = 'An error occurred during sign in. Check your email and password.';
        if (err.toString().includes('InvalidCredentialsError')) {
          errorMessage = 'Invalid email and/or password. Please try again.';
        }
        alert({
          title: 'Error',
          message: errorMessage,
          okButtonText: 'Okay'
        });
        this._logService.logException(err);
      });
  }

  navToForgotPassword() {
    this._routerExtensions.navigate(['/forgot-password']);
  }

  onEmailTextChange(args) {
    this._isEmailValid(this.user.email);
  }

  navToSignUp() {
    this._routerExtensions.navigate(['/sign-up']);
  }

  private _isEmailValid(text: string): boolean {
    // validate the email
    CLog('isEmailValid', text);
    if (!text) {
      this.emailError = 'Email is required.';
      return false;
    }
    // make sure it's a valid email
    const email = text.trim();
    if (!validate(email)) {
      this.emailError = `${email} is not a valid email address.`;
      return false;
    }

    this.emailError = '';
    return true;
  }

  private _isPasswordValid(text: string): boolean {
    // validate the password
    if (!text) {
      this.passwordError = 'Password is required.';
      return false;
    }
    this.passwordError = '';
    return true;
  }
}
