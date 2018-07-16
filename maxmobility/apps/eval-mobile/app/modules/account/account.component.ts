// angular
import { Component, OnInit } from '@angular/core';
import { CLog } from '@maxmobility/core';
import { FileService, LoggingService, ProgressService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import { NavigationStart, Router } from '@angular/router';
import * as camera from 'nativescript-camera';
import * as email from 'nativescript-email';
import { ImageCropper } from 'nativescript-imagecropper';
import * as LS from 'nativescript-localstorage';
import * as imageSource from 'tns-core-modules/image-source';
import { confirm } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
import { ModalDialogService } from 'nativscript-angular/directives/dialogs';
import { PrivacyPolicyComponent } from '../../privacy-policy';

@Component({
  selector: 'Account',
  moduleId: module.id,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  fsKeyPrefix: string = 'AccountComponent.';
  fsKeyProfilePicture: string = 'ProfilePicture';

  // tslint:disable-next-line:member-ordering
  user: Kinvey.User = this._userService.user;

  languages: string[] = this._translateService.getLangs();
  selectedLanguageIndex: number = 0;

  yes: string = this._translateService.instant('dialogs.yes');
  no: string = this._translateService.instant('dialogs.no');
  success: string = this._translateService.instant('user.success');
  ok: string = this._translateService.instant('dialogs.ok');
  account_update: string = this._translateService.instant('user.account-update');
  account_update_confirm: string = this._translateService.instant('user.account-update-confirm');
  account_update_complete: string = this._translateService.instant('user.account-update-complete');
  account_reset: string = this._translateService.instant('user.account-reset');
  account_reset_confirm: string = this._translateService.instant('user.account-reset-confirm');
  password_change: string = this._translateService.instant('user.password-change');
  password_change_confirm: string = this._translateService.instant('user.password-change-confirm');
  // tslint:disable-next-line:member-ordering
  sign_out: string = this._translateService.instant('user.sign-out');
  sign_out_confirm: string = this._translateService.instant('user.sign-out-confirm');

  private imageCropper: ImageCropper;
  private routeSub: any; // subscription to route observer

  constructor(
    private _userService: UserService,
    private _progressService: ProgressService,
    private _loggingService: LoggingService,
    private _routerExtensions: RouterExtensions,
    private router: Router,
    private _page: Page,
    private _translateService: TranslateService,
    private _fileService: FileService,
    private modal: ModalDialogService,
    private vcRef: ViewContainerRef
  ) {
    this._page.enableSwipeBackNavigation = false;
    this.imageCropper = new ImageCropper();
  }

  ngOnInit() {
    // save when we navigate away!
    // see https://github.com/NativeScript/nativescript-angular/issues/1049
    this.routeSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // now save
        console.log('Saving user data when navigating away!');
        this._saveUserToKinvey();
      }
    });

    // handle the privacy policy / consent stuff!
    let has_agreed = (this.user.data as any).has_agreed_to_user_agreement;
    let has_read = (this.user.data as any).has_read_privacy_policy;
    if (!has_agreed) {
      console.log('NEED TO AGREE!');
    }
    if (!has_read) {
      console.log('NEED TO READ!');
    }

    // load profile picture
    this.loadProfilePicture();

    // set language data
    this.selectedLanguageIndex =
      this.languages.indexOf((this.user.data as any).language) > -1
        ? this.languages.indexOf((this.user.data as any).language)
        : 0;

    // get translation files
    this._fileService.downloadTranslationFiles();
  }

  async showModal(): Promise<boolean> {
    let options = {
      context: {
        user: this.user.data
      },
      fullscreen: true,
      viewContainerRef: this.vcRef
    };
    return this.modal.showModal(PrivacyPolicyComponent, options).then(res => {
      if (res) {
        (this.user.data as any).has_read_privacy_policy = res.has_read_privacy_policy;
        (this.user.data as any).has_agreed_to_user_agreement = res.has_agreed_to_user_agreement;
        (this.user.data as any).consent_to_research = res.consent_to_research;
        (this.user.data as any).consent_to_product_development = res.consent_to_product_development;
      }
      const hasAgreed =
        (this.user.data as any).has_read_privacy_policy && (this.user.data as any).has_agreed_to_user_agreement;
      return hasAgreed;
    });
  }

  getProfilePictureFSKey(): string {
    return this.fsKeyPrefix + (this.user.data as any)._id + '.' + this.fsKeyProfilePicture;
  }

  saveProfilePicture(source) {
    try {
      const picKey = this.getProfilePictureFSKey();
      const b64 = source.toBase64String('png');
      const pic = LS.setItem(picKey, b64);
      (this.user.data as any).profile_picture = source;
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`Couldn't save profile picture: ${err}`);
    }
  }

  loadProfilePicture() {
    try {
      const picKey = this.getProfilePictureFSKey();
      const pic = LS.getItem(picKey);
      if (pic) {
        const source = imageSource.fromBase64(pic);
        (this.user.data as any).profile_picture = source;
      } else {
        (this.user.data as any).profile_picture = undefined;
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`Couldn't load profile picture: ${err}`);
    }
  }

  onUpdateProfilePictureTap() {
    if (camera.isAvailable()) {
      camera
        .requestPermissions()
        .then(() => {
          console.log('Updating profile picture!');

          const options = {
            width: 256,
            height: 256,
            lockSquare: true
          };

          camera
            .takePicture({
              width: 500,
              height: 500,
              keepAspectRatio: true,
              cameraFacing: 'front'
            })
            .then(imageAsset => {
              const source = new imageSource.ImageSource();
              source.fromAsset(imageAsset).then(iSrc => {
                this.imageCropper
                  .show(iSrc, options)
                  .then(args => {
                    if (args.image !== null) {
                      this.saveProfilePicture(args.image);
                    }
                  })
                  .catch(e => {
                    console.dir(e);
                  });
              });
            })
            .catch(err => {
              console.log('Error -> ' + err.message);
            });
        })
        .catch(err => {
          console.log('Error -> ' + err.message);
        });
    } else {
      console.log('No camera available');
    }
  }

  onLanguageChanged(args) {
    const newLanguage = this.languages[args.newIndex] || 'en';
    (this.user.data as any).language = newLanguage;
    this._translateService.use(newLanguage);
    // save the user setting to their account when changed
    this._saveUserToKinvey();
  }

  onDrawerButtonTap() {
    this._routerExtensions.navigate(['/home'], {
      transition: {
        name: 'slideBottom',
        duration: 350,
        curve: 'easeInOut'
        // clearHistory: true
      }
    });
  }

  onSaveAccountTap() {
    confirm({
      title: this.account_update,
      message: this.account_update_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
    }).then(result => {
      if (result) {
        this._saveUserToKinvey().then(resp => {
          CLog('update response', JSON.stringify(resp));
          alert({ title: this.success, message: this.account_update_complete, okButtonText: this.ok });
        });
      }
    });
  }

  onChangePasswordTap() {
    confirm({
      title: this.password_change,
      message: this.password_change_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
    });
  }

  onResetAccountTap() {
    confirm({
      title: this.account_reset,
      message: this.account_reset_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
    });
  }

  /**
   * Confirm with user to sign out. If confirmed, sign out, then nav to login.
   */
  onSignOutTap() {
    confirm({
      title: this.sign_out,
      message: this.sign_out_confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
    }).then(result => {
      CLog('signout confirm result', result);
      if (result) {
        this._userService
          .logout()
          .then(() => {
            this._routerExtensions.navigate(['/login'], {
              clearHistory: true
            });
          })
          .catch(error => {
            this._loggingService.logException(error);
          });
      }
    });
  }

  /**
   * Confirm with user to provide feedback.
   */
  onFeedbackTap() {
    confirm({
      title: this._translateService.instant('user.provide-feedback-confirm-title'),
      message: this._translateService.instant('user.provide-feedback-confirm-message'),
      okButtonText: this.yes,
      cancelButtonText: this.no
    }).then(confirmResult => {
      if (confirmResult) {
        // send email to user
        email
          .available()
          .then(available => {
            if (available) {
              email
                .compose({
                  to: ['feedback@max-mobility.com'],
                  subject: this._translateService.instant('user.feedback-email-subject'),
                  body: '',
                  cc: []
                })
                .then(result => {
                  if (result) {
                    console.log('email compose result', result);
                  } else {
                    console.log('the email may NOT have been sent!');
                  }
                })
                .catch(error => console.error(error));
            }
          })
          .catch(error => console.error(error));
      }
    });
  }

  onDebugMenuTap() {
    this._routerExtensions.navigate(['/settings']);
  }

  private _saveUserToKinvey() {
    return this.user
      .update({
        email: (this.user.data as any).email,
        language: (this.user.data as any).language,
        first_name: (this.user.data as any).first_name,
        last_name: (this.user.data as any).last_name,
        phone_number: (this.user.data as any).phone_number
      })
      .catch(err => {
        this._loggingService.logException(err);
      });
  }
}
