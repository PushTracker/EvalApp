import { Component } from '@angular/core';
import { Demo, User, UserTypes } from '@maxmobility/core';
import { DemoService, FirmwareService, LocationService, LoggingService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import * as geolocation from 'nativescript-geolocation';
import { SnackBar } from 'nativescript-snackbar';
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
export class DemosComponent {
  get Demos(): ObservableArray<Demo> {
    return DemoService.Demos;
  }

  private _snackBar = new SnackBar();
  private _datastore = Kinvey.DataStore.collection<any>('SmartDrives');

  constructor(
    private routerExtensions: RouterExtensions,
    private _demoService: DemoService,
    private _firmwareService: FirmwareService,
    private _logService: LoggingService,
    private _translateService: TranslateService,
    private _userService: UserService
  ) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  onDemoTap(args) {
    const index = args.index;
    this.routerExtensions.navigate(['/demo-detail'], {
      queryParams: {
        index
      }
    });
  }

  addDemo() {
    // add a new demo
    console.log('add a new demo');
    this.routerExtensions.navigate(['/demo-detail'], {});
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
        // if more than 750ms pass then show a snackbar that location is being calculated...
        processTimeout = setTimeout(() => {
          this._snackBar.simple(this._translateService.instant('demos.location-calculating'));
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
   * show list actions for clinicians and reps based on the user type.
   * 1. handing over a demo unit to a clinician
   * 2. retrieving a demo unit from a clinician
   * 3. requesting a demo unit from nearby reps
   */

  async onDemoActionsButtonTap(demo: Demo) {
    // setting the action strings here for both creating the actions based on type
    // and for the switch to determine the action selected
    const requestAction = this._translateService.instant('demos.request-demo-action');
    const toClinicianAction = this._translateService.instant('demos.demo-to-clinician-action');
    const fromClinicianAction = this._translateService.instant('demos.retrieve-from-clinician-action');

    // clinician user type options
    const clinicianOpts = [requestAction];
    // rep user type options
    const repOpts = [toClinicianAction, fromClinicianAction];
    const userType = (Kinvey.User.getActiveUser().data as User).type as number;

    const result = await action({
      message: 'Demo Unit Actions',
      actions: userType === UserTypes.Representative ? repOpts : clinicianOpts,
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
      case requestAction:
        console.log('request demo from rep');
        response = await http.request({
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
        console.log('response', response.statusCode);

        break;
      case toClinicianAction:
        console.log('handing to clinician');

        const clinicianEmail = await prompt({
          message: `Clinician's email?`,
          okButtonText: 'Enter',
          cancelButtonText: 'Cancel'
        });

        console.log(clinicianEmail.text);

        response = await http.request({
          method: 'POST',
          url: 'https://baas.kinvey.com/rpc/kid_SyIIDJjdM/custom/demo-unit-actions',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Kinvey ${token}`
          },
          content: JSON.stringify({
            action: '1',
            demoId: demo.id
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
