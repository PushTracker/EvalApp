import { Injectable } from '@angular/core';
// lib
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { validate } from 'email-validator';

import { File } from 'file-system';
import * as Kinvey from 'kinvey-nativescript-sdk';
import { User } from '@maxmobility/core';

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
    const imageFile = File.fromPath(localFullPath);
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
      .then((files: Array<any>) => {
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

  // getUserDetails() {
  //   return Kinvey.User.getActiveUser().metadata;
  // }
}
