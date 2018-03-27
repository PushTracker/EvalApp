import { Injectable } from '@angular/core';
// lib
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { validate } from 'email-validator';

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

  // getUserDetails() {
  //   return Kinvey.User.getActiveUser().metadata;
  // }
}
