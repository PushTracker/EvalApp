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

  error_1: string = '';
  error_2: string = '';
  error_title: string = '';
  error_ok: string = '';
  password_error: string = '';
  email_error: string = '';

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
    
    this._translateService.get('user.signing-in', {value: ''}).subscribe((res: string) => {
    console.log(res);
    this._progressService.show(res);
    
    });

    this._translateService.get('user.sign-in-error-1').subscribe((res: string) => {
    this.error_1 = res
    });
    this._translateService.get('user.sign-in-error-2').subscribe((res: string) => {
    this.error_2 = res
    });
    this._translateService.get('user.sign-in-error-title').subscribe((res: string) => {
    this.error_title = res
    });
    this._translateService.get('user.sign-in-error-ok').subscribe((res: string) => {
    this.error_ok = res
    });

    

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
          title: this.error_title,
          message: errorMessage,
          okButtonText: this.error_ok
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

    this._translateService.get('user.email-error').subscribe((res: string) => {
    this.email_error = res
    });

    if (!text) {
      this.emailError = 'Email is required.';
      return false;
    }
    // make sure it's a valid email
    const email = text.trim();
    if (!validate(email)) {
      this.emailError = `${email}` + this.email_error;
      return false;
    }

    this.emailError = '';
    return true;
  }

  private _isPasswordValid(text: string): boolean {
    // validate the password
    this._translateService.get('user.password-error').subscribe((res: string) => {
    this.password_error = res
    });

    if (!text) {
      this.passwordError = this.password_error;
      return false;
    }
    this.passwordError = '';
    return true;
  }
}
