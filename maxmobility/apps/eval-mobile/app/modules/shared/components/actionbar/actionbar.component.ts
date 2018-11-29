import { Component, Input, NgZone } from '@angular/core';

import { ActionBar, ActionItem } from 'ui/action-bar';

import { BluetoothService } from '@maxmobility/mobile';

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

  status = 0;

  constructor(private _zone: NgZone) {
    super();

    this.onPushTrackerStateChange();
  }

  ngOnInit() {
    BluetoothService.pushTrackerStatus.removeEventListener(
      Observable.propertyChangeEvent,
      this.onPushTrackerStateChange
    );
    BluetoothService.pushTrackerStatus.addEventListener(
      Observable.propertyChangeEvent,
      this.onPushTrackerStateChange,
      this
    );
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

  /*
	// Connectivity Events
	onPushTrackerPaired() {
		this.statusImage = '~/assets/images/pt-conn-grey.png'
	}

	onPushTrackerConnected() {
		this.statusImage = '~/assets/images/pt-conn-yellow.png'
	}

	onPushTrackerDisconnected() {
		this.statusImage = '~/assets/images/pt-conn-grey.png'
	}

	onPushTrackerData() {
		this.statusImage = '~/assets/images/pt-conn-green.png'
	}

	unregister(): void {
		console.log('actionbar: unregistering for events!');
		BluetoothService.PushTrackers.off(ObservableArray.changeEvent);
		BluetoothService.PushTrackers.map(pt => {
			pt.off(PushTracker.pushtracker_paired_event);
			pt.off(PushTracker.pushtracker_connect_event);
			pt.off(PushTracker.pushtracker_disconnect_event);
			pt.off(PushTracker.pushtracker_settings_event);
		});
	}

	register(): void {
		this.unregister();
		// handle pushtracker pairing events for existing pushtrackers
		console.log('actionbar: registering for events!');
		BluetoothService.PushTrackers.map(pt => {
			pt.on(PushTracker.pushtracker_paired_event, this.onPushTrackerPaired, this);
			pt.on(PushTracker.pushtracker_connect_event, this.onPushTrackerConnected, this);
			pt.on(PushTracker.pushtracker_disconnect_event, this.onPushTrackerDisconnected, this);
			pt.on(PushTracker.pushtracker_version_event, this.onPushTrackerData, this);
		});

		// listen for completely new pusthrackers (that we haven't seen before)
		BluetoothService.PushTrackers.on(
			ObservableArray.changeEvent,
			(args: ChangedData<number>) => {
				if (args.action === 'add') {
					const pt = BluetoothService.PushTrackers.getItem(
						BluetoothService.PushTrackers.length - 1
					);
					if (pt) {
						pt.on(PushTracker.pushtracker_paired_event, this.onPushTrackerPaired, this);
						pt.on(PushTracker.pushtracker_connect_event, this.onPushTrackerConnected, this);
						pt.on(PushTracker.pushtracker_disconnect_event, this.onPushTrackerDisconnected, this);
						pt.on(PushTracker.pushtracker_version_event, this.onPushTrackerData, this);
					}
				}
			}
		);
	}
	*/
}
