import { Component, OnInit } from '@angular/core';
import { Page } from 'tns-core-modules/ui/page';
import { PropertyChangeData } from 'tns-core-modules/data/observable';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { Store, select } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';
import { UserService, ProgressService } from '@maxmobility/mobile';
import { User, LoggingService, CLog } from '@maxmobility/core';
import { validate } from 'email-validator';
import { Kinvey } from 'kinvey-nativescript-sdk';

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
  ) {}

  ngOnInit() {
    CLog('SignUpComponent OnInit');
    this._page.actionBarHidden = true;
    this._page.backgroundSpanUnderStatusBar = true;
  }

  async signUpTap() {
    // validate user form
    // TODO: improve this with UI tips and not alerts that block the user
    if (!this.user.first_name || !this.user.last_name || !this.user.email || !this.user.password) {
      CLog('form is invalid');
      alert({ message: 'The form is invalid. Please fill in all fields.' });
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
    const isTaken = await this._userService.isUsernameTaken(this.user.username).catch(err => {
      this._logService.logException(err);
      this._progressService.hide();
    });
    CLog('isTaken', isTaken);

    if (isTaken) {
      CLog('Username is taken');
      alert({ title: 'Error', message: 'An account with this email already exists.' });
      return;
    }

    const signUpResult = await this._userService.register(this.user).catch(err => {
      this._logService.logException(err);
      this._progressService.hide();
    });

    if (signUpResult) {
      this._progressService.hide();
      CLog(JSON.stringify(signUpResult));
      alert({ title: 'Success', message: `Sign up successful. Your account email is ${signUpResult.email}` }).then(
        () => {
          this._router.navigate(['/home'], { clearHistory: true });
        }
      );
    }
  }

  onReturnPress(args: PropertyChangeData) {
    CLog('return press object', args.object);
  }

  navToLogin() {
    this._router.navigate(['/login']);
  }
}
