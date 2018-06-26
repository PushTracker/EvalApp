import { Component, OnInit } from '@angular/core';
import { CLog, LoggingService, User } from '@maxmobility/core';
import { preventKeyboardFromShowing, ProgressService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { validate } from 'email-validator';
import { RouterExtensions } from 'nativescript-angular/router';
import { alert } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
import { DropDownModule } from 'nativescript-drop-down/angular';
import { setMarginForNoActionBarOnPage } from '~/utils';

@Component({
  selector: 'eval-login',
  moduleId: module.id,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  user = new User();

  passwordError = '';
  emailError = '';
  firstNameError = '';
  lastNameError = '';

  languages: Array<string> = this._translateService.getLangs();
  selectedLanguageIndex: number = 0;

  error: string = this._translateService.instant('user.error');
  ok: string = this._translateService.instant('dialogues.ok');
  form_invalid: string = this._translateService.instant('user.form-invalid');
  email_invalid: string = this._translateService.instant('user.email-invalid');
  account_creating: string = this._translateService.instant('user.account-creating');
  success: string = this._translateService.instant('user.success');
  sign_up_success: string = this._translateService.instant('user.sign-up-success');
  sign_up_error: string = this._translateService.instant('user.sign-up-error');
  first_name_error: string = this._translateService.instant('user.first-name-error');
  last_name_error: string = this._translateService.instant('user.last-name-error');
  password_error: string = this._translateService.instant('user.password-error');
  email_error: string = this._translateService.instant('user.email-error');
  email_required: string = this._translateService.instant('user.email-required');

  constructor(
    private _userService: UserService,
    private _logService: LoggingService,
    private _progressService: ProgressService,
    private _page: Page,
    private _router: RouterExtensions,
    private _translateService: TranslateService
  ) {
    preventKeyboardFromShowing();
  }

  ngOnInit() {
    CLog('SignUpComponent OnInit');
    this._page.actionBarHidden = true;
    this._page.backgroundSpanUnderStatusBar = true;
    setMarginForNoActionBarOnPage(this._page);
  }

  onLanguageChanged(args) {
    const newLanguage = this.languages[args.newIndex] || 'en';
    this.user.language = newLanguage;
    this._translateService.use(newLanguage);
  }

  onSubmitTap() {
    // validate user form
    const isFirstNameValid = this._isFirstNameValid(this.user.first_name);
    if (!isFirstNameValid) {
      return;
    }

    const isLastNameValid = this._isLastNameValid(this.user.last_name);
    if (!isLastNameValid) {
      return;
    }

    // validate the email
    const isEmailValid = this._isEmailValid(this.user.email);
    if (!isEmailValid) {
      return;
    }

    const isPasswordValid = this._isPasswordValid(this.user.password);
    if (!isPasswordValid) {
      return;
    }

    this.user.username = this.user.email.toLowerCase().trim();

    this._progressService.show(this.account_creating);
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
              title: this.success,
              message: this.sign_up_success + ` ${user.email}`,
              okButtonText: this.ok
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
        alert({ title: this.error, message: this.sign_up_error, okButtonText: this.ok });
      });
  }

  onReturnPress(args) {
    CLog('return press object', args.object.id);
  }

  onEmailTextChange(args) {
    this._isEmailValid(this.user.email);
  }

  navToLogin() {
    this._router.navigate(['/login'], {
      transition: {
        name: 'slideRight'
      }
    });
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

  private _isFirstNameValid(text: string): boolean {
    // validate the password

    if (!text) {
      this.firstNameError = this.first_name_error;
      return false;
    }
    this.firstNameError = '';
    return true;
  }

  private _isLastNameValid(text: string): boolean {
    // validate the password

    if (!text) {
      this.lastNameError = this.last_name_error;
      return false;
    }
    this.lastNameError = '';
    return true;
  }
}
