import { Component, Input, NgZone } from '@angular/core';

import { ActionBar, ActionItem } from 'ui/action-bar';

import { BluetoothService } from '@maxmobility/mobile';

import { NavigationStart, NavigationEnd, Router } from '@angular/router';
import { Page } from 'tns-core-modules/ui/page';
import { Subscription } from 'rxjs';

import { Observable, fromObject } from 'tns-core-modules/data/observable';

@Component({
  selector: 'MaxActionBar',
  moduleId: module.id,
  templateUrl: './actionbar.component.html',
  styleUrls: ['./actionbar.component.css']
})
export class ActionbarComponent extends ActionBar {
  @Input() title: string;
  @Input() allowNav: boolean = true;

  status = BluetoothService.pushTrackerStatus;

  private routeSub: Subscription; // subscription to route observer

  constructor(
    private _page: Page,
    private _router: Router,
    private _zone: NgZone
  ) {
    super();
    this.onPushTrackerStateChange(null);
    this.register();
  }

  onPTConnTap(): void {
    // TODO: dialog popup with info about the state
  }

  onPushTrackerStateChange(args: any) {
    this._zone.run(() => {
      this.status = BluetoothService.pushTrackerStatus.get('state');
      console.log('status', this.status);
    });
  }

  unregister(): void {
    BluetoothService.pushTrackerStatus.removeEventListener(
      Observable.propertyChangeEvent,
      this.onPushTrackerStateChange
    );
  }

  register(): void {
    //this.unregister();
    BluetoothService.pushTrackerStatus.addEventListener(
      Observable.propertyChangeEvent,
      this.onPushTrackerStateChange,
      this
    );
  }
}
