import { Injectable } from '@angular/core';
import { Push } from 'kinvey-nativescript-sdk/push';
import { User } from '@maxmobility/core';
import * as http from 'tns-core-modules/http';
import * as fs from 'tns-core-modules/file-system';
import * as Kinvey from 'kinvey-nativescript-sdk';
import * as pushPlugin from 'nativescript-push-notifications';
import * as localstorage from 'nativescript-localstorage';

@Injectable()
export class UserService {
  public static Kinvey_App_Key = 'kid_SyIIDJjdM';
  public static Kinvey_App_Secret = '3cfe36e6ac8f4d80b04014cc980a4d47';
  public static Kinvey_Host_Url = 'https://baas.kinvey.com/';
  constructor() {}

  /**
   * Will return the active user from the Kinvey auth.
   */
  get user() {
    return Kinvey.User.getActiveUser();
  }

  register(user: User) {
    return Kinvey.User.signup(user);
  }

  isUsernameTaken(username: string) {
    return Kinvey.User.exists(username);
  }

  login(username: string, pw: string) {
    return Kinvey.User.login(username.trim(), pw.trim());
  }

  logout() {
    return Kinvey.User.logout();
  }

  resetPassword(email: string) {
    return Kinvey.User.resetPassword(email);
  }

  uploadImage(remoteFullPath: string, localFullPath: string): Promise<any> {
    const imageFile = fs.File.fromPath(localFullPath);
    const imageContent = imageFile.readSync();

    const metadata = {
      filename: imageFile.name,
      mimeType: this.getMimeType(imageFile.extension),
      size: imageContent.length,
      public: true
    };

    return Kinvey.Files.upload(imageFile, metadata, { timeout: 2147483647 })
      .then((uploadedFile: any) => {
        const query = new Kinvey.Query();
        query.equalTo('_id', uploadedFile._id);

        return Kinvey.Files.find(query);
      })
      .then((files: any[]) => {
        if (files && files.length) {
          const file = files[0];
          file.url = file._downloadURL;

          return file;
        } else {
          Promise.reject(new Error('No items with the given ID could be found.'));
        }
      });
  }

  private getMimeType(imageExtension: string): string {
    const extension = imageExtension === 'jpg' ? 'jpeg' : imageExtension;

    return 'image/' + extension.replace(/\./g, '');
  }

  unregisterForPushNotifications() {}

  registerForPushNotifications() {
    const usePUSH = false;
    if (usePUSH) {
      const promise = Push.register({
        android: {
          senderID: '1053576736707'
        },
        ios: {
          alert: true,
          badge: true,
          sound: true
        }
      })
        .then((deviceToken: string) => {
          console.log(`registered push notifications: ${deviceToken}`);
          Push.onNotification((data: any) => {
            alert(`Message received!\n${JSON.stringify(data)}`);
          });
        })
        .catch((error: Error) => {
          console.log(`Couldn't register push notifications: ${error}`);
        });
    } else {
      pushPlugin.register(
        {
          // android specific
          senderID: '1053576736707',
          notificationCallbackAndroid: (stringifiedData: string, fcmNotification: any) => {
            console.log('GOT NOTIFICATION');
            console.log(`Got notification: ${stringifiedData}`);
          },
          // ios specific
          alert: true,
          badge: true,
          sound: true,
          interactiveSettings: {
            actions: [
              {
                identifier: 'READ_IDENTIFIER',
                title: 'Read',
                activationMode: 'foreground',
                destructive: false,
                authenticationRequired: true
              },
              {
                identifier: 'CANCEL_IDENTIFIER',
                title: 'Cancel',
                activationMode: 'foreground',
                destructive: true,
                authenticationRequired: true
              }
            ],
            categories: [
              {
                identifier: 'READ_CATEGORY',
                actionsForDefaultContext: ['READ_IDENTIFIER', 'CANCEL_IDENTIFIER'],
                actionsForMinimalContext: ['READ_IDENTIFIER', 'CANCEL_IDENTIFIER']
              }
            ]
          },
          notificationCallbackIOS: (message: any) => {
            alert('Message received!\n' + JSON.stringify(message));
          }
        },
        token => {
          console.log(`registered push notifications: ${token}`);
        },
        error => {
          console.log(`Couldn't register push notifications: ${error}`);
        }
      );
    }
  }

  /**
   * Downloads the i18n json translation files from the Kinvey account and saves to the `assets/i18n/` directory that the ngx TranslateService will use to load files.
   */
  async downloadTranslationFiles() {
    console.log('===== userService.downloadTranslationFiles ====');
    // query Kinvey Files for all translation files
    const query = new Kinvey.Query();
    query.equalTo('translation_file', true);
    const files = await Kinvey.Files.find(query);

    if (files.length >= 1) {
      files.forEach(async file => {
        const filePath = fs.path.join(fs.knownFolders.currentApp().path, `assets/i18n/${file._filename}`);
        http.getFile(file._downloadURL, filePath).catch(err => {
          console.log('error using http.getFile', err);
        });
      });
    }
  }

  // getUserDetails() {
  //   return Kinvey.User.getActiveUser().metadata;
  // }
}
