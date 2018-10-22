import { Component, OnInit } from '@angular/core';
import { Demo, User } from '@maxmobility/core';
import { DemoService, FirmwareService, LocationService, LoggingService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import * as geolocation from 'nativescript-geolocation';
import { ToastDuration, Toasty } from 'nativescript-toasty';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import * as http from 'tns-core-modules/http';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { clearTimeout, setTimeout } from 'tns-core-modules/timer/timer';
import { action, confirm, prompt } from 'tns-core-modules/ui/dialogs';

@Component({
  selector: 'Demos',
  moduleId: module.id,
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent implements OnInit {
  get Demos(): ObservableArray<Demo> {
    return DemoService.Demos;
  }

  userType: number;

  currentUserId: string;

  private _datastore = Kinvey.DataStore.collection<any>('SmartDrives');

  constructor(
    private _routerExtensions: RouterExtensions,
    private _demoService: DemoService,
    private _firmwareService: FirmwareService,
    private _logService: LoggingService,
    private _translateService: TranslateService,
    private _userService: UserService
  ) {}

  ngOnInit() {
    console.log('Demos.Component OnInit');
    new Toasty(this._translateService.instant('demos.owner-color-explanation'), ToastDuration.LONG).show();
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

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  onDemoTap(index: any) {
    this._routerExtensions.navigate(['/demo-detail'], {
      queryParams: {
        index
      }
    });
  }

  addDemo() {
    // add a new demo
    console.log('add a new demo');
    this._routerExtensions.navigate(['/demo-detail'], {});
  }

  /**
   * Confirm if user wants to update the location of the demo unit to the current location (and tell them what it is).
   * @param demo [Demo] - Demo unit to update.
   */
  async onUpdateLocationButtonTap(demo: Demo) {
    let processTimeout = 0;

    try {
      console.log(demo);

      const isEnabled = await geolocation.isEnabled();
      if (isEnabled) {
        // if more than 750ms pass then show a toasty that location is being calculated...
        processTimeout = setTimeout(() => {
          new Toasty(this._translateService.instant('demos.location-calculating')).show();
        }, 750);
      }

      const loc = await LocationService.getLocationData();
      // clear the timeout when done
      clearTimeout(processTimeout);

      console.log('current location', loc);

      // confirm with user if they want to update the demo location
      const result = await confirm({
        message: `${this._translateService.instant('demos.location-confirm-message')} ${loc.place_name}?`,
        okButtonText: this._translateService.instant('dialogs.yes'),
        neutralButtonText: this._translateService.instant('dialogs.no')
      });

      if (result === true) {
        // update the demo units location 👍
        console.log('need to update demo now');
        demo.location = loc.place_name;
        demo.geo = [loc.longitude, loc.latitude];
        this._datastore.save(demo);
      }
    } catch (error) {
      // clear the timeout when done
      clearTimeout(processTimeout);
      this._logService.logException(error);
    }
  }

  /**
   * Action for Clinicians to request a demo unit.
   * Brad  - moving this to the action bar and only showing for Clinician Users, this isn't tied to a demo unit
   * so it doesn't need to be in the list. Which would not work if they had no demo units in their posession.
   */
  async requestDemo() {
    console.log('clinician requesting demo tap');

    const confirmResult = await confirm({
      title: 'Demo Unit Actions',
      message: this._translateService.instant('demos.request-demo-action'),
      okButtonText: this._translateService.instant('dialogs.yes'),
      cancelable: true,
      cancelButtonText: this._translateService.instant('dialogs.cancel')
    });

    if (confirmResult === true) {
      const token = (this._userService.user._kmd as any).authtoken;

      console.log('request demo from rep');
      const response = await http.request({
        method: 'POST',
        url: 'https://baas.kinvey.com/rpc/kid_SyIIDJjdM/custom/demo-unit-actions',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Kinvey ${token}`
        },
        content: JSON.stringify({
          action: '0'
        })
      });
      console.log('response code', response.statusCode);
      if (response.statusCode === 200) {
        new Toasty(this._translateService.instant('demos.demo-request-success')).show();
      } else {
        alert({
          message: this._translateService.instant('demos.demo-request-error'),
          okButtonText: this._translateService.instant('dialogs.ok')
        });
      }
    }
  }

  /**
   * show list actions for clinicians and reps based on the user type.
   * 1. handing over a demo unit to a clinician
   * 2. retrieving a demo unit from a clinician
   * 3. requesting a demo unit from nearby reps
   */

  async onRepDemoActionButtonTap(demo: Demo) {
    // create the Rep user type actions for demos
    const toClinicianAction = this._translateService.instant('demos.demo-to-clinician-action');
    const fromClinicianAction = this._translateService.instant('demos.retrieve-from-clinician-action');
    const repOpts = [toClinicianAction, fromClinicianAction];

    const result = await action({
      message: 'Demo Unit Actions',
      actions: repOpts,
      cancelable: true,
      cancelButtonText: 'Cancel'
    });

    // if no action selected
    if (!result) {
      return;
    }

    const token = (this._userService.user._kmd as any).authtoken;
    let response;

    switch (result) {
      case toClinicianAction:
        console.log('handing to clinician');

        const promptResult = await prompt({
          message: `Clinician's email?`,
          okButtonText: 'Enter',
          cancelButtonText: 'Cancel'
        });

        if (!promptResult.text) {
          console.log('no email entered into prompt for clinician');
          return;
        }

        const clinicianEmail = promptResult.text;
        console.log('clinicianEmail', clinicianEmail);

        response = await http.request({
          method: 'POST',
          url: 'https://baas.kinvey.com/rpc/kid_SyIIDJjdM/custom/demo-unit-actions',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Kinvey ${token}`
          },
          content: JSON.stringify({
            action: '1',
            demoId: demo.id,
            clinicianEmail
          })
        });
        console.log('response', response.statusCode);
        break;
      case fromClinicianAction:
        console.log('retrieve from clinician');
        response = await http.request({
          method: 'POST',
          url: 'https://baas.kinvey.com/rpc/kid_SyIIDJjdM/custom/demo-unit-actions',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Kinvey ${token}`
          },
          content: JSON.stringify({
            action: '2',
            demoId: demo.id
          })
        });
        console.log('response', response.statusCode);
        break;
    }
  }
}
