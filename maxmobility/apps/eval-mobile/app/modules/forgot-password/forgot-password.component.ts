import { Component, OnInit } from '@angular/core';
import { CLog, LoggingService } from '@maxmobility/core';
import { preventKeyboardFromShowing, ProgressService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { validate } from 'email-validator';
import { RouterExtensions } from 'nativescript-angular/router';
import { PropertyChangeData } from 'tns-core-modules/data/observable';
import { alert } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
import { setMarginForIosSafeArea } from '~/utils';

@Component({
  selector: 'forgot-password',
  moduleId: module.id,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  email = '';
  emailError = '';

  error: string = this._translateService.instant('user.error');
  ok: string = this._translateService.instant('dialogs.ok');
  submitting: string = this._translateService.instant('user.submitting');
  success: string = this._translateService.instant('user.success');
  account_error: string = this._translateService.instant('user.account-error');
  email_error: string = this._translateService.instant('user.email-error');
  check_email: string = this._translateService.instant('user.check-email');
  email_required: string = this._translateService.instant('user.email-required');
  email_sent: string = this._translateService.instant('user.email-sent');

  constructor(
    private _routerExtensions: RouterExtensions,
    private _logService: LoggingService,
    private _progressService: ProgressService,
    private _userService: UserService,
    private _page: Page,
    private _translateService: TranslateService
  ) {
    preventKeyboardFromShowing();
  }

  ngOnInit(): void {
    CLog('ForgotPasswordComponent OnInit');
    this._page.actionBarHidden = true;
    this._page.backgroundSpanUnderStatusBar = true;
    setMarginForIosSafeArea(this._page);
  }

  goBack() {
    if (this._routerExtensions.canGoBack()) {
      this._routerExtensions.back();
    } else {
      this._routerExtensions.navigate(['/login'], {
        transition: {
          name: 'slideRight'
        }
      });
    }
  }

  onSubmitTap() {
    // validate the email
    if (!this.email) {
      this.emailError = this.email_required;
      return;
    }
    // make sure it's a valid email
    const em = this.email.trim();
    if (!validate(em)) {
      this.emailError = `"${em} "` + this.email_error;
      return;
    }

    this.emailError = '';

    this._progressService.show(this.submitting);

    this._userService
      .resetPassword(this.email)
      .then(resp => {
        CLog('resp', resp);
        this._progressService.hide();
        alert({
          title: this.email_sent,
          message: this.check_email,
          okButtonText: this.ok
        }).then(() => {
          this._routerExtensions.navigate(['/login'], {
            transition: {
              name: 'slideRight'
            }
          });
        });
      })
      .catch(err => {
        this._logService.logException(err);
        this._progressService.hide();
        alert({
          title: this.error,
          message: this.account_error,
          okButtonText: this.ok
        });
      });
  }

  onEmailTextChange(args: PropertyChangeData) {
    CLog('args', args.value);
    // make sure it's a valid email
    const em = this.email.trim();
    this.emailError = !validate(em) ? `"${em}" ` + this.email_error : '';
  }

  navToLogin() {
    this._routerExtensions.navigate(['/login'], {
      transition: {
        name: 'slideRight'
      }
    });
  }
}
