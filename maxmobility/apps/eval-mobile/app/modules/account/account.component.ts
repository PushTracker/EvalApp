import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CLog, DidYouKnow, User, UserTypes } from '@maxmobility/core';
import { FileService, LoggingService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import * as camera from 'nativescript-camera';
import { ValueList } from 'nativescript-drop-down';
import * as email from 'nativescript-email';
import { ImageCropper } from 'nativescript-imagecropper';
import * as LS from 'nativescript-localstorage';
import { ToastDuration, ToastPosition, Toasty } from 'nativescript-toasty';
import { Subscription } from 'rxjs';
import * as http from 'tns-core-modules/http';
import * as imageSource from 'tns-core-modules/image-source';
import { isIOS } from 'tns-core-modules/platform';
import { alert, confirm, prompt } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
import { KinveyKeys } from '~/kinvey-keys';

@Component({
  selector: 'Account',
  moduleId: module.id,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  fsKeyPrefix = 'AccountComponent.';
  fsKeyProfilePicture = 'ProfilePicture';
  user: Kinvey.User;

  didyouknow = new DidYouKnow();

  isAdminAccount = false;
  canBetaTest = false;

  /**
   * Languages for translation language dropdown
   */
  languages = new ValueList<string>(
    this._translateService.getLangs().map(l => {
      return { value: l, display: this._translateService.instant('languages.' + l) };
    })
  );
  selectedLanguageIndex = 0;

  yes: string = this._translateService.instant('dialogs.yes');
  no: string = this._translateService.instant('dialogs.no');

  private imageCropper: ImageCropper;
  private _routeSub: Subscription; // subscription to route observer
  private profileImageKey: string;

  constructor(
    private _userService: UserService,
    private _loggingService: LoggingService,
    private _routerExtensions: RouterExtensions,
    private router: Router,
    private _page: Page,
    private _translateService: TranslateService,
    private _fileService: FileService,
    private _zone: NgZone
  ) {
    this._page.enableSwipeBackNavigation = false;

    this.imageCropper = new ImageCropper();
    this.user = Kinvey.User.getActiveUser();
    this.profileImageKey = this.fsKeyPrefix + this.user._id + '.' + this.fsKeyProfilePicture;

    // configure if they are an admin account
    this.isAdminAccount = (this.user.data as User).type === UserTypes.Admin;

    // configure if they can opt in for beta testing firmware - only
    // allowed for @permobil.com and @max-mobility.com email
    // addresses
    const emailRegEx = /[^@]+@(permobil.com|max\-mobility.com)/i;
    this.canBetaTest = emailRegEx.test((this.user.data as User).email);
  }

  ngOnInit() {
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
      const data = this.user.data as User;
      data.profile_picture = source;
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
    if (this._routerExtensions.canGoBack()) {
      this._routerExtensions.back();
    } else {
      this._routerExtensions.navigate(['/home'], {
        transition: {
          name: 'slideBottom',
          duration: 350,
          curve: 'easeInOut'
        }
      });
    }
  }

  onSaveAccountTap() {
    confirm({
      title: this._translateService.instant('user.account-update'),
      message: this._translateService.instant('user.account-update-confirm'),
      okButtonText: this.yes,
      cancelButtonText: this.no
    }).then(result => {
      if (result) {
        this._saveUserToKinvey()
          .then(resp => {
            CLog('update response', JSON.stringify(resp));
            new Toasty(
              this._translateService.instant('user.account-update-complete'),
              ToastDuration.SHORT,
              ToastPosition.CENTER
            ).show();
          })
          .catch(error => {
            alert({
              message: this._translateService.instant('user.account-update-error'),
              okButtonText: this._translateService.instant('dialogs.ok')
            });
          });
      }
    });
  }

  onChangePasswordTap() {
    confirm({
      title: this._translateService.instant('user.password-change'),
      message: this._translateService.instant('user.password-change-confirm'),
      okButtonText: this.yes,
      cancelButtonText: this.no
    });
  }

  onResetAccountTap() {
    confirm({
      title: this._translateService.instant('user.account-reset'),
      message: this._translateService.instant('user.account-reset-confirm'),
      okButtonText: this.yes,
      cancelButtonText: this.no
    });
  }

  /**
   * Confirm with user to sign out. If confirmed, sign out, then nav to login.
   */
  async onSignOutTap() {
    try {
      const result = await confirm({
        title: this._translateService.instant('user.sign-out'),
        message: this._translateService.instant('user.sign-out-confirm'),
        okButtonText: this.yes,
        cancelButtonText: this.no
      });
      CLog('signout confirm result', result);
      if (result) {
        this._zone.run(async () => {
          // go ahead and nav to login to keep UI moving without waiting
          this._routerExtensions.navigate(['/login'], {
            clearHistory: true
          });

          const logoutResult = await this._userService.logout();
          console.log('logoutResult', logoutResult);
        });
      }
    } catch (error) {
      // calling logout here manually incase something goes wrong ^^^
      Kinvey.User.logout();
      this._loggingService.logException(error);
    }
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
        to: ['Feedback.SmartDrive@permobil.com'],
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
      console.log('saving DidYouKnow to Kinvey...');
      await Kinvey.DataStore.collection('DidYouKnow').save({
        all_users: this.didyouknow.all_users,
        creator_id: this._userService.user._id,
        text: this.didyouknow.text
      });
      console.log('DidYouKnow saved to Kinvey data collection');

      // use the authtoken that is returned during a login for the endpoint auth
      const token = (this._userService.user._kmd as any).authtoken;
      const response = await http.request({
        method: 'POST',
        url: `${KinveyKeys.HOST_URL}/rpc/${KinveyKeys.APP_KEY}/custom/didyouknow`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Kinvey ${token}`
        },
        content: JSON.stringify({
          key: result.text,
          text: this.didyouknow.text,
          all_users: this.didyouknow.all_users
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
    console.log('userService.user', this._userService.user);
    if (this._userService.user) {
      const data = this._userService.user.data as User;
      console.log('user data', data);
      return this.user
        .update({
          email: data.email,
          language: data.language,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          type: data.type
        })
        .catch(err => {
          this._loggingService.logException(err);
        });
    } else {
      return Promise.resolve();
    }
  }
}
