import { Injectable } from '@angular/core';
import { User } from '@maxmobility/core';
import * as Kinvey from 'kinvey-nativescript-sdk';
import { Push } from 'kinvey-nativescript-sdk/push';
import { CFAlertDialog, CFAlertStyle } from 'nativescript-cfalert-dialog';
import * as fs from 'tns-core-modules/file-system/file-system';

@Injectable()
export class UserService {
  public static Kinvey_App_Key = 'kid_SyIIDJjdM';
  public static Kinvey_App_Secret = '3cfe36e6ac8f4d80b04014cc980a4d47';
  public static Kinvey_Host_Url = 'https://baas.kinvey.com/';
  public static hasRegistered = false;
  private _cfAlertDialog = new CFAlertDialog();

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

  /**
   * Unregister for push notifications so the device doesn't receive any after signing out.
   * Then logout the Kinvey User.
   */
  logout() {
    return new Promise(async (resolve, reject) => {
      try {
        // only call if registered
        console.log('user.service logout() UserService.hasRegistered = ' + UserService.hasRegistered);
        if (UserService.hasRegistered === true) {
          // kinvey docs might be out of date on `unregister` method
          await Push.unregister({
            android: {
              senderID: '1053576736707'
            }
          }).catch(error => {
            console.log('unregister in kinvey push error', error);
          });
        }
        UserService.hasRegistered = false;
        await Kinvey.User.logout();
        resolve(true);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
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

  // unregisterForPushNotifications() {
  //   console.log('Unregistering for push notifications');
  //   UserService.hasRegistered = false;
  //   return Push.unregister();
  // }

  _registerForPushNotifications() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(
          '*** user.service _registerForPushNotifications *** UserService.hasRegistered = ' + UserService.hasRegistered
        );
        let register = null;
        if (!UserService.hasRegistered) {
          register = await Push.register({
            android: {
              senderID: '1053576736707',
              notificationCallbackAndroid: (data, notification) => {
                console.log(data);
                console.log(notification);
                this._cfAlertDialog.show({
                  // Options go here
                  dialogStyle: CFAlertStyle.NOTIFICATION,
                  title: 'New Message from Smart Evaluation',
                  message: notification.getBody(),
                  backgroundBlur: true,
                  cancellable: true,
                  onDismiss: dialog => {
                    console.log('Dialog was dismissed');
                  }
                });
              }
            },
            ios: {
              alert: true,
              badge: true,
              sound: true,
              notificationCallbackIOS: message => {
                console.log(message);
                console.log('message.alert', message.alert);
                this._cfAlertDialog.show({
                  // Options go here
                  dialogStyle: CFAlertStyle.NOTIFICATION,
                  title: 'New Message from Smart Evaluation',
                  message: message.alert,
                  backgroundBlur: true,
                  cancellable: true,
                  onDismiss: dialog => {
                    console.log('Dialog was dismissed');
                  }
                });
              }
            }
          });
          UserService.hasRegistered = true;
          resolve(register);
        }

        resolve(register);
      } catch (error) {
        reject(error);
      }
    });
  }
}
