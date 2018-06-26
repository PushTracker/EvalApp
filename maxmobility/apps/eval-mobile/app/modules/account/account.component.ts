// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { confirm } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
import { Image } from 'tns-core-modules/ui/image';
import * as fileSystemModule from 'tns-core-modules/file-system';
import * as imageSource from 'tns-core-modules/image-source';
import * as camera from 'nativescript-camera';
import { ImageCropper } from 'nativescript-imagecropper';
import * as LS from 'nativescript-localstorage';
// app
import { ValueList } from 'nativescript-drop-down';
import { DropDownModule } from 'nativescript-drop-down/angular';
import { UserService, ProgressService, LoggingService } from '@maxmobility/mobile';
import { User, CLog } from '@maxmobility/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'Account',
  moduleId: module.id,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  public fsKeyPrefix: string = 'AccountComponent.';
  public fsKeyProfilePicture: string = 'ProfilePicture';

  private imageCropper: ImageCropper;

  constructor(
    private _userService: UserService,
    private _progressService: ProgressService,
    private _loggingService: LoggingService,
    private _router: RouterExtensions,
    private _page: Page,
    private _translateService: TranslateService
  ) {
    this._page.enableSwipeBackNavigation = false;
    this.imageCropper = new ImageCropper();
  }

  // tslint:disable-next-line:member-ordering
  user: Kinvey.User = this._userService.user;

  languages: Array<string> = this._translateService.getLangs();
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

  ngOnInit() {
    this.loadProfilePicture();
    this.selectedLanguageIndex =
      this.languages.indexOf((this.user.data as any).language) > -1
        ? this.languages.indexOf((this.user.data as any).language)
        : 0;
  }

  getProfilePictureFSKey(): string {
    return this.fsKeyPrefix + this.user.data._id + '.' + this.fsKeyProfilePicture;
  }

  saveProfilePicture(source) {
    try {
      const picKey = this.getProfilePictureFSKey();
      const b64 = source.toBase64String('png');
      const pic = LS.setItem(picKey, b64);
      this.user.data.profile_picture = source;
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
        let source = new imageSource.fromBase64(pic);
        this.user.data.profile_picture = source;
      } else {
        this.user.data.profile_picture = undefined;
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
              let source = new imageSource.ImageSource();
              source.fromAsset(imageAsset).then(source => {
                this.imageCropper
                  .show(source, options)
                  .then(args => {
                    if (args.image !== null) {
                      this.saveProfilePicture(args.image);
                    }
                  })
                  .catch(function(e) {
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
  }

  onDrawerButtonTap() {
    this._router.navigate(['/home'], {
      transition: {
        name: 'slideBottom',
        duration: 350,
        curve: 'easeInOut',
        clearHistory: true
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
        this.user
          .update({
            email: (this.user.data as any).email,
            language: (this.user.data as any).language,
            first_name: (this.user.data as any).first_name,
            last_name: (this.user.data as any).last_name,
            phone_number: (this.user.data as any).phone_number
          })
          .then(resp => {
            CLog('update response', JSON.stringify(resp));
            alert({ title: this.success, message: this.account_update_complete, okButtonText: this.ok });
          })
          .catch(err => {
            this._loggingService.logException(err);
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
            this._router.navigate(['/login'], {
              clearHistory: true
            });
          })
          .catch(error => {
            this._loggingService.logException(error);
          });
      }
    });
  }

  onDebugMenuTap() {
    this._router.navigate(['/settings']);
  }
}
