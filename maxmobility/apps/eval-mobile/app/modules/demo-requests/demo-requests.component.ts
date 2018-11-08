import { Component, OnInit } from '@angular/core';
import { Demo, User, DemoRequest } from '@maxmobility/core';
import { DemoService, FirmwareService, LocationService, LoggingService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import * as geolocation from 'nativescript-geolocation';
import { ToastDuration, ToastPosition, Toasty } from 'nativescript-toasty';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import * as http from 'tns-core-modules/http';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { clearTimeout, setTimeout } from 'tns-core-modules/timer/timer';
import { action, confirm, prompt } from 'tns-core-modules/ui/dialogs';
import { KinveyKeys } from '~/kinvey-keys';

@Component({
  selector: 'DemoRequests',
  moduleId: module.id,
  templateUrl: './demo-requests.component.html'
})
export class DemoRequestsComponent implements OnInit {
  userType: number;

  currentUserId: string;

  private _datastore = Kinvey.DataStore.collection<any>('DemoRequests');

  constructor(
    private _routerExtensions: RouterExtensions,
    private _demoService: DemoService,
    private _firmwareService: FirmwareService,
    private _logService: LoggingService,
    private _translateService: TranslateService,
    private _userService: UserService
  ) {}

  ngOnInit() {
    console.log('Demo-Requests.Component OnInit');
    const activeUser = Kinvey.User.getActiveUser();
    this.userType = (activeUser.data as User).type as number;
    this.currentUserId = activeUser._id;
    console.log('userType', this.userType);
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }
}
