import { Component } from '@angular/core';
import { Demo, UserTypes } from '@maxmobility/core';
import { DemoService, FirmwareService, LocationService, LoggingService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import * as geolocation from 'nativescript-geolocation';
import { SnackBar } from 'nativescript-snackbar';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { clearTimeout, setTimeout } from 'tns-core-modules/timer/timer';
import { action, confirm } from 'tns-core-modules/ui/dialogs';

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
    private _translateService: TranslateService
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
   * show list actions for clinicians
   * 1. handing over a demo unit to a clinician
   * 2. retrieving a demo unit from a clinician
   * 3. requesting a demo unit from nearby reps
   */

  async onDemoActionsButtonTap(demo: Demo) {
    // clinician user type options
    const cOpts = ['Request Demo from Rep.'];
    // rep user type options
    const rOpts = ['Handing Demo to Clinician', 'Retrieve Demo from Clinician'];
    console.log('Kinvey.User.getActiveUser().type', Kinvey.User.getActiveUser().data.type);

    const result = await action({
      message: 'Demo Unit Actions',
      actions: Kinvey.User.getActiveUser().data.type === UserTypes.Representative ? rOpts : cOpts,
      cancelable: true,
      cancelButtonText: 'Cancel'
    });

    // if no action selected
    if (!result) {
      return;
    }

    switch (result) {
      case 'Handing Demo to Clinician':
        console.log('handing to clinician');
        break;
      case 'Retrieve Demo from Clinician':
        console.log('retrieve from clinician');
        break;
      case 'Request Demo from Rep':
        console.log('request demo from rep');
        break;
    }
  }
}
