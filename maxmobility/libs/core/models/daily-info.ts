const Packet = require( "../packet/packet" );

export class DailyInfo {
    // public members
    public year: number = 2017;
    public month: number = 1;
    public day: number = 1;
    public pushesWith: number = 0;
    public pushesWithout: number = 0;
    public coastWith: number = 0;
    public coastWithout: number = 0;
    public distance: number = 0;
    public speed: number = 0;
    public ptBattery: number = 0;
    public sdBattery: number = 0;
    public date: Date = null;

    // private members

    // functions

    constructor(obj?: any) {
	if (obj !== null && obj !== undefined) {
	    if (typeof obj === typeof Array) {
		this.fromUint8Array(obj);
	    }
	    else {
		this.fromObject(obj);
	    }
	}
    }

    public add(di): void {
	this.pushesWith += di && di.pushesWith || 0;
	this.pushesWithout += di && di.pushesWithout || 0;
	this.coastWith += di && di.coastWith || 0;
	this.coastWithout += di && di.coastWithout || 0;
	this.distance += di && di.distance || 0;
    }

    public getDate(): Date {
	return new Date(
	    this.year,
	    this.month - 1, // their month is zero indexed
	    this.day
	);
    }

    public sameAsDate(date): boolean {
	const d = this.getDate();
	return d.getFullYear() === date.getFullYear() &&
	    d.getMonth() === date.getMonth() &&
	    d.getDate() === date.getDate();
    }

    public sameAsDailyInfo(di): boolean {
	return this.year === di.year &&
	    this.month === di.month &&
	    this.day === di.day;
    }

    public fromObject(obj: any): void {
	this.year = obj && obj.year || 2017;
	this.month = obj && obj.month || 1;
	this.day = obj && obj.day || 1;
	this.pushesWith = obj && obj.pushesWith || 0;
	this.pushesWithout = obj && obj.pushesWithout || 0;
	this.coastWith = obj && obj.coastWith || 0;
	this.coastWithout = obj && obj.coastWithout || 0;
	this.distance = obj && obj.distance || 0;
	this.speed = obj && obj.speed || 0;
	this.ptBattery = obj && obj.ptBattery || 0;
	this.sdBattery = obj && obj.sdBattery || 0;

	this.date = this.getDate();
    }

    public fromUint8Array(arr: Uint8Array): void {
	const p = new Packet.Packet(arr);
	this.fromPacket(p);
	p.destroy();
    }

    public fromPacket(p): void {
	const di = p.data("dailyInfo");
	this.year = di.year;
	this.month = di.month;
	this.day = di.day;
	this.pushesWith = di.pushesWith;
	this.pushesWithout = di.pushesWithout;
	this.coastWith = di.coastWith;
	this.coastWithout = di.coastWithout;
	this.distance = di.distance;
	this.speed = di.speed;
	this.ptBattery = di.ptBattery;
	this.sdBattery = di.sdBattery;

	this.date = this.getDate();
    }

}
