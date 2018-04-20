export class PushTracker {
  // public members
  public version: number = 0xff; // firmware version number
  public battery: number = 0; // battery percent Stat of Charge (SoC)

  public address: string = ''; // MAC Address

  // private members

  // functions
  constructor(obj?: any) {
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

  public data(): any {
    return {
      version: this.version,
      address: this.address,
      battery: this.battery
    };
  }

  public fromObject(obj: any): void {
    this.version = (obj && obj.version) || 0xff;
    this.battery = (obj && obj.battery) || 0;
    this.address = (obj && obj.address) || '';
  }
}
