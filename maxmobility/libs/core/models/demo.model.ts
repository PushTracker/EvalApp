import { Observable } from 'tns-core-modules/data/observable';
import { Kinvey } from 'kinvey-nativescript-sdk';

import { LocationService } from '@maxmobility/mobile';

import * as _ from 'underscore';

export class Record extends Observable {
  time: Date;
  geo: Array<number>;
  location: string;
  user_id: string;

  constructor(obj?: any) {
    super();
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

  fromObject(obj: any) {
    Object.assign(this, obj);
  }

  data(): any {
    var obj = {
      time: this.time,
      geo: this.geo,
      location: this.location,
      user_id: this.user_id
    };
    return obj;
  }

  getTime(): Date {
    return typeof this.time === 'string' ? new Date(this.time) : this.time;
  }
}

export class Demo extends Observable {
  // STATIC:
  public static editableProperties = [
    'model',
    'geo',
    'location',
    'smartdrive_serial_number',
    'pushtracker_serial_number',
    'pt_version',
    'ble_version',
    'mcu_version',
    'pt_mac_addr',
    'sd_mac_addr'
  ];

  // NON STATIC:
  public id = null;
  public geo = [];
  public owner_id: string = '';
  public model: string = '';
  public location: string = '';
  public smartdrive_serial_number: string = '';
  public pushtracker_serial_number: string = '';
  public pt_version: string = '';
  public ble_version: string = '';
  public mcu_version: string = '';
  public pt_mac_addr: string = '';
  public sd_mac_addr: string = '';
  public usage: Array<Record> = [];

  get location_string(): string {
    if (this.location && this.location.length) {
      return this.location.trim();
    } else {
      return '??';
    }
  }

  get version_string(): string {
    return [this.pt_version_string, this.mcu_version_string, this.ble_version_string].join(', ');
  }

  get pt_version_string(): string {
    if (this.pt_version && this.pt_version.length && this.pt_version.includes('.')) {
      return this.pt_version.trim();
    } else {
      return '??';
    }
  }

  get ble_version_string(): string {
    if (this.ble_version && this.ble_version.length && this.ble_version.includes('.')) {
      return this.ble_version.trim();
    } else {
      return '??';
    }
  }

  get mcu_version_string(): string {
    if (this.mcu_version && this.mcu_version.length && this.mcu_version.includes('.')) {
      return this.mcu_version.trim();
    } else {
      return '??';
    }
  }

  constructor(obj?: any) {
    super();
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

  fromObject(obj: any) {
    Object.assign(this, obj);
    this.usage = this.usage.map(r => new Record(r));
    this.sortUsage();
  }

  data(): any {
    var obj = {
      geo: this.geo,
      usage: this.usage.map(r => {
        return r.data();
      })
    };
    Object.keys(this).map(k => {
      if (typeof this[k] === 'number' || typeof this[k] === 'string' || typeof this[k] === 'boolean') {
        obj[k] = this[k];
      }
    });
    return obj;
  }

  versionsAreEqualTo(version: string): boolean {
    return (
      this.pt_version.includes(version) && this.mcu_version.includes(version) && this.ble_version.includes(version)
    );
  }

  getTime(): string {
    let str = '??';
    if (this.usage && this.usage.length) {
      str = this.usage[0].getTime().toISOString();
    }
    return str;
  }

  update(demo: any) {
    Demo.editableProperties.map(p => {
      this[p] = demo[p];
    });
    this.usage.push(...demo.usage);
    this.sortUsage();
  }

  sortUsage() {
    this.usage.sort((a, b) => {
      const aDate = a.getTime();
      const bDate = b.getTime();
      return aDate < bDate ? 1 : -1;
    });
    this.usage = _.uniq(this.usage, true, o => o.getTime().toISOString());
  }

  use(): Promise<any> {
    return LocationService.getLocationData().then(locationData => {
      const geo = [locationData.longitude, locationData.latitude];
      const location = locationData.place_name;
      const record = new Record({
        time: new Date(),
        geo: geo,
        location: location,
        user_id: Kinvey.User.getActiveUser()._id
      });
      this.usage.unshift(record);
      this.sortUsage();
      this.geo = geo;
      this.location = location;
    });
  }
}
