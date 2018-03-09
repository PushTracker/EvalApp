import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';

import { User } from './user';
import { Config } from './config';

@Injectable()
export class LoginService {
  constructor(private http: Http) {}

  register(user: User) {
    Config.user.loggedIn = false;

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');

    return this.http
      .post(
        Config.apiUrl + 'auth/',
        JSON.stringify({
          email: user.email,
          password: user.password,
          password_confirmation: user.password
        }),
        { headers }
      )
      .map(res => {
        console.log(`res: ${res}`);
        const headers2 = res.headers;
        console.log(`headers2:\n ${JSON.stringify(headers2, null, 2)}`);

        return res.json();
      })
      .do(data => {
        console.log(`data: ${data}`);
        console.log(JSON.stringify(data, null, 2));
      })
      .catch(this.handleErrors);
  }

  login(user: User) {
    Config.user.loggedIn = false;

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');

    return this.http
      .post(
        Config.apiUrl + 'auth/sign_in',
        JSON.stringify({
          email: user.email,
          password: user.password
        }),
        { headers }
      )
      .map(res => {
        console.log(`res: ${res}`);
        const headers2 = res.headers;
        Config.token = headers2['access-token'];
        Config.client = headers2['client'];
        Config.uid = headers2['uid'];
        Config.user = user;
        Config.user.loggedIn = true;

        return res.json();
      })
      .do(data => {
        console.log(`data: ${data}`);
        Config.user.name = data.data.first_name;
        console.log(JSON.stringify(data, null, 2));
      })
      .catch(this.handleErrors);
  }

  handleErrors(error: Response) {
    Config.user.loggedIn = false;

    console.log(error.json());

    return Observable.throw(error);
  }
}
