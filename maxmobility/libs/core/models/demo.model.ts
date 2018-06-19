import { Observable } from 'tns-core-modules/data/observable';

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
}

export class Demo extends Observable {
  // STATIC:
  public static editableProperties = [
    'model',
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
      geo: this.geo,
      usage: this.usage.map(r => r.data())
    };
    Object.keys(this).map(k => {
      if (typeof this[k] === 'number' || typeof this[k] === 'string' || typeof this[k] === 'boolean') {
        obj[k] = this[k];
      }
    });
    return obj;
  }
}
