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
import { UserService, preventKeyboardFromShowing } from '@maxmobility/mobile';
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

  constructor(private _routerExtensions: RouterExtensions, private _userService: UserService, private _page: Page) {
    preventKeyboardFromShowing();
  }

  ngOnInit(): void {
    console.log('LoginComponent OnInit');
    this._page.actionBarHidden = true;
    this._page.backgroundSpanUnderStatusBar = true;
  }

  enterApp(): void {
    this._routerExtensions.navigate(['/home'], {
      transition: {
        name: 'fade'
      },
      clearHistory: true
    });
  }

  cancel() {
    this._userService
      .logout()
      .then(() => {
        console.log('logged out active user');
        this.enterApp();
      })
      .catch(err => {
        console.log('logout err', err);
      });
  }

  submit() {
    // validate the email
    const isEmailValid = this._isEmailValid(this.user.email);
    if (!isEmailValid) {
      return;
    }

    const isPasswordValid = this._isPasswordValid(this.user.password);
    if (!isPasswordValid) {
      return;
    }

    // now try logging in with Kinvey user account
    this._userService
      .login(this.user.email, this.user.password)
      .then(res => {
        console.log('login res', res);
      })
      .catch(err => {
        console.log('login error', err);
      });
  }

  navToForgotPassword() {
    this._routerExtensions.navigate(['/forgot-password']);
  }

  onEmailTextChange(args: PropertyChangeData) {
    console.log('args', args.value);
    // this._isEmailValid(args.value);
    this._isEmailValid(this.user.email);
  }

  navToSignUp() {
    this._routerExtensions.navigate(['/sign-up']);
  }

  private _isEmailValid(text: string): boolean {
    // validate the email
    console.log('isemailvalid', text);
    if (!text) {
      this.emailError = 'Email is required.';
      return false;
    }
    // make sure it's a valid email
    const email = text.trim();
    if (!validate(email)) {
      this.emailError = `${email} is not a valid email address!`;
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

  private handleErrors(error, message, defaultText): void {
    const errors = error.json && error.json().errors;
    if (errors && errors.length) {
      alert(`${message}:\n${errors.join('\n')}`);
    } else if (errors && errors.full_messages) {
      alert(`${message}:\n${errors.full_messages}`);
    } else {
      alert(defaultText);
    }
  }
}
