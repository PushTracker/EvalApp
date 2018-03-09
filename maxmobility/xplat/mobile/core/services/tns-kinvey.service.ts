import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http';

// lib
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { validate } from 'email-validator';

import * as Kinvey from 'kinvey-nativescript-sdk';
import { User } from '@maxmobility/core';

@Injectable()
// export class TNSKinveyService extends KinveyService {
export class TNSKinveyService {
  public static Kinvey_App_Key = 'kid_SyIIDJjdM';
  public static Kinvey_App_Secret = '3cfe36e6ac8f4d80b04014cc980a4d47';
  public static Kinvey_Host_Url = 'https://baas.kinvey.com/';

  constructor(private http: Http) {}

  get user() {
    return Kinvey.User.getActiveUser();
  }

  register(user: User) {
    return Kinvey.User.signup(user);
  }

  login(username: string, pw: string) {
    return Kinvey.User.login(username.trim(), pw.trim());
  }

  //   loginWithMIC() {
  //     return TNSKinvey.Kinvey.User.loginWithMIC('http://redirecturi');
  //   }

  logoff() {
    return Kinvey.User.logout();
  }

  resetPassword(email) {
    return Kinvey.User.resetPassword(email);
  }
}
