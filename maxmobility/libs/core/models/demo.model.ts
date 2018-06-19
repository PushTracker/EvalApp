import { Observable } from 'tns-core-modules/data/observable';

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
  public model: string = '';
  public location: string = '';
  public smartdrive_serial_number: string = '';
  public pushtracker_serial_number: string = '';
  public pt_version: string = '';
  public ble_version: string = '';
  public mcu_version: string = '';
  public pt_mac_addr: string = '';
  public sd_mac_addr: string = '';
  public use_times: Array<Date> = [];

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
      use_times: this.use_times
    };
    Object.keys(this).map(k => {
      if (typeof this[k] === 'number' || typeof this[k] === 'string' || typeof this[k] === 'boolean') {
        obj[k] = this[k];
      }
    });
    return obj;
  }
}
