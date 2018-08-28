import { Injectable } from '@angular/core';
import { User } from '@maxmobility/core';
import * as Kinvey from 'kinvey-nativescript-sdk';
import { Push } from 'kinvey-nativescript-sdk/push';
import * as fs from 'tns-core-modules/file-system/file-system';
import { alert } from 'tns-core-modules/ui/dialogs';
import { LoggingService } from './logging.service';

@Injectable()
export class UserService {
  public static Kinvey_App_Key = 'kid_SyIIDJjdM';
  public static Kinvey_App_Secret = '3cfe36e6ac8f4d80b04014cc980a4d47';
  public static Kinvey_Host_Url = 'https://baas.kinvey.com/';

  private static hasRegistered = false;
  constructor(private _loggingService: LoggingService) {}

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
    return this.unregisterForPushNotifications()
      .then(() => {
        return Kinvey.User.logout();
      })
      .catch(() => {
        return Kinvey.User.logout();
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

  unregisterForPushNotifications() {
    console.log('Unregistering for push notifications');
    UserService.hasRegistered = false;
    return Push.unregister()
      .then(() => {
        console.log('Successfully unregistered for push notifications');
      })
      .catch((error: Error) => {
        console.log('Could not unregister for push notifications: ', error);
      });
  }

  registerForPushNotifications() {
    if (!UserService.hasRegistered) {
      return Push.register({
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
          this._loggingService.logMessage(`registered push notifications: ${deviceToken}`);
          UserService.hasRegistered = true;
          Push.onNotification((data: any) => {
            console.log('RECEIVED NOTIFICATION:');
            console.log(JSON.stringify(data));
            alert(`Message received!\n${JSON.stringify(data)}`);
          });
        })
        .catch((error: Error) => {
          this._loggingService.logException(error);
          console.log(`Couldn't register push notifications: ${error}`);
        });
    }
  }

  // getUserDetails() {
  //   return Kinvey.User.getActiveUser().metadata;
  // }
}
