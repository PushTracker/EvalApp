import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { CLog } from '@maxmobility/core';
import { FileService, LoggingService, ProgressService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { ModalDialogService } from 'nativescript-angular/directives/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import * as camera from 'nativescript-camera';
import { ValueList } from 'nativescript-drop-down';
import * as email from 'nativescript-email';
import { ImageCropper } from 'nativescript-imagecropper';
import * as LS from 'nativescript-localstorage';
import { Subscription } from 'rxjs';
import * as http from 'tns-core-modules/http';
import * as imageSource from 'tns-core-modules/image-source';
import { isIOS } from 'tns-core-modules/platform';
import { alert, confirm, prompt } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'Account',
  moduleId: module.id,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  fsKeyPrefix = 'AccountComponent.';
  fsKeyProfilePicture = 'ProfilePicture';
  user: Kinvey.User = this._userService.user;

  /**
   * Value of the hidden Did You Know textfield for Devon to send data to Kinvey to trigger push notifications.
   */
  didyouknow: string;
  languages = new ValueList<string>(
    this._translateService.getLangs().map(l => {
      return { value: l, display: this._translateService.instant('languages.' + l) };
    })
  );
  selectedLanguageIndex = 0;

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
  sign_out: string = this._translateService.instant('user.sign-out');
  sign_out_confirm: string = this._translateService.instant('user.sign-out-confirm');

  private imageCropper: ImageCropper;
  private routeSub: Subscription; // subscription to route observer
  private profileImageKey = this.fsKeyPrefix + (this.user.data as any)._id + '.' + this.fsKeyProfilePicture;

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
        console.log('Saving user data when navigating away from account.');
        this._saveUserToKinvey();
      }
    });

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

  saveProfilePicture(source: imageSource.ImageSource) {
    try {
      const b64 = source.toBase64String('png');
      LS.setItem(this.profileImageKey, b64);
      (this.user.data as any).profile_picture = source;
    } catch (err) {
      this._loggingService.logException(err);
    }
  }

  loadProfilePicture() {
    try {
      const pic = LS.getItem(this.profileImageKey);
      if (pic) {
        const source = imageSource.fromBase64(pic);
        (this.user.data as any).profile_picture = source;
      } else {
        (this.user.data as any).profile_picture = undefined;
      }
    } catch (err) {
      this._loggingService.logException(err);
    }
  }

  async onUpdateProfilePictureTap() {
    try {
      if (!camera.isAvailable()) {
        console.log('Camera not available on device.');
        return;
      }

      await camera.requestPermissions().catch(error => {
        console.log('Permission denied for camera.');
        let msg: string;
        if (isIOS) {
          msg = `Smart Evaluation app does not have permission to open your camera.
          Please go to settings and enable the camera permission.`;
        } else {
          msg = `Smart Evaluation app needs the Camera permission to open the camera.`;
        }

        alert({ message: msg, okButtonText: 'Okay' });
        return null;
      });

      console.log('Updating profile picture!');

      const imageAsset = await camera.takePicture({
        width: 500,
        height: 500,
        keepAspectRatio: true,
        cameraFacing: 'front'
      });

      const iSrc = await imageSource.fromAsset(imageAsset);

      const result = await this.imageCropper.show(iSrc, {
        height: 256,
        width: 256,
        lockSquare: true
      });

      if (result && result.image !== null) {
        this.saveProfilePicture(result.image);
      }
    } catch (error) {
      this._loggingService.logException(error);
    }
  }

  onLanguageChanged(args) {
    const newLanguage = this.languages.getValue(args.newIndex) || 'en';
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
  async onFeedbackTap() {
    const confirmResult = await confirm({
      title: this._translateService.instant('user.provide-feedback-confirm-title'),
      message: this._translateService.instant('user.provide-feedback-confirm-message'),
      okButtonText: this.yes,
      cancelButtonText: this.no
    }).catch(e => {
      this._loggingService.logException(e);
    });

    if (confirmResult === false) {
      // user denied the confirmation
      console.log('User denied the confirmation to open email to send feedback.');
      return;
    }

    // check if device has email available
    const canEmail = await email.available().catch(e => {
      this._loggingService.logException(e);
    });

    if (!canEmail) {
      // email is available on device
      console.log('Email is not available on the device.');
      return;
    }

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
      .catch(e => {
        this._loggingService.logException(e);
      });
  }

  onDebugMenuTap() {
    this._routerExtensions.navigate(['/settings']);
  }

  /**
   * Submits the value in the textview (didyouknow data value) to Kinvey endpoint
   * which sends out a push notification to users.
   */
  async submitDidYouKnow() {
    console.log('submitDidYouKnow tapped');
    // prompt for the private key to make sure before sending
    const result = await prompt({
      message: 'Enter the private key?',
      cancelable: true,
      okButtonText: 'Enter',
      cancelButtonText: 'Cancel'
    });

    // if prompt text is empty just return
    if (!result.text) {
      return;
    }

    try {
      // use the authtoken that is returned during a login for the endpoint auth
      const token = (this._userService.user._kmd as any).authtoken;
      const response = await http.request({
        method: 'POST',
        url: 'https://baas.kinvey.com/rpc/kid_SyIIDJjdM/custom/didyouknow',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Kinvey ${token}`
        },
        content: JSON.stringify({
          key: result.text,
          text: this.didyouknow
        })
      });

      console.log('response', response);

      // if error show alert with error from Kinvey endpoint
      if (response.statusCode !== 200) {
        this._loggingService.logException(new Error(response.content.toString()));
        const message = response.content.toJSON().debug ? `${response.content.toJSON().debug}` : 'Error sending data.';
        alert({
          message,
          okButtonText: 'Okay'
        });
      } else {
        alert({
          message: 'Request successful to save Did You Know',
          okButtonText: 'Okay'
        });
      }
    } catch (error) {
      this._loggingService.logException(error);
      alert(error);
    }
  }

  private _saveUserToKinvey() {
    if (this._userService.user) {
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
    } else {
      return Promise.resolve();
    }
  }
}
