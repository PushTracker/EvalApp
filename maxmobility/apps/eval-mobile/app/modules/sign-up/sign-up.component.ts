import { Component, OnInit } from '@angular/core';
import { Page } from 'tns-core-modules/ui/page';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { UserService, ProgressService, preventKeyboardFromShowing } from '@maxmobility/mobile';
import { User, LoggingService, CLog } from '@maxmobility/core';
import { validate } from 'email-validator';

@Component({
  selector: 'eval-login',
  moduleId: module.id,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  user = new User();

  constructor(
    private _userService: UserService,
    private _logService: LoggingService,
    private _progressService: ProgressService,
    private _page: Page,
    private _router: RouterExtensions
  ) {
    preventKeyboardFromShowing();
  }

  ngOnInit() {
    CLog('SignUpComponent OnInit');
    this._page.actionBarHidden = true;
    this._page.backgroundSpanUnderStatusBar = true;
  }

  onSubmitTap() {
    // validate user form
    // TODO: improve this with UI tips and not alerts that block the user
    if (!this.user.first_name || !this.user.last_name || !this.user.email || !this.user.password) {
      CLog('form is invalid');
      alert({ message: 'The form is invalid. Please fill in all fields.', okButtonText: 'Okay' });
      return;
    }

    // validate the email
    if (!validate(this.user.email)) {
      alert({ message: 'Email is invalid.', okButtonText: 'Okay' });
      return;
    }

    this.user.username = this.user.email.toLowerCase().trim();

    this._progressService.show('Creating account...');
    // need to make sure the username is not already taken
    this._userService
      .isUsernameTaken(this.user.username)
      .then(result => {
        // now create the account
        this._userService
          .register(this.user)
          .then(user => {
            CLog(JSON.stringify(user));
            this._progressService.hide();
            alert({
              title: 'Success',
              message: `Sign up successful. Your account email is ${user.email}`,
              okButtonText: 'Okay'
            }).then(() => {
              this._router.navigate(['/home'], { clearHistory: true });
            });
          })
          .catch(err => {
            this._progressService.hide();
            this._logService.logException(err);
          });
      })
      .catch(err => {
        this._progressService.hide();
        this._logService.logException(err);
        alert({ title: 'Error', message: 'An error occurred during sign up.', okButtonText: 'Okay' });
      });
  }

  onReturnPress(args) {
    CLog('return press object', args.object.id);
  }

  navToLogin() {
    this._router.navigate(["/login"],
        {
        transition: {
          name: 'slideRight'
        }
      }
    );
  }
}
