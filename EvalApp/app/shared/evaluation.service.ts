import { Injectable } from '@angular/core';

import { Observable, fromObject } from "data/observable";

export class Settings {
    // public members
    public PushingPain: string = "Yes";
    public PushingFatigue: string = "Yes";

    public pain: number = 30;
    public fatigue: number = 70;
    public independence: number = 100;

    // private members

    // functions

    constructor(obj?: any) {
	if (obj !== null && obj !== undefined) {
	    this.fromObject(obj);
	}
    }

    public fromObject(obj: any): void {
	this.PushingPain = obj && obj.PushingPain || "Yes";
	this.PushingFatigue = obj && obj.PushingFatigue || "Yes";

	this.pain = obj && obj.pain || 30;
	this.fatigue = obj && obj.fatigue || 70;
	this.independence = obj && obj.independence || 100;
    }
}

@Injectable()
export class EvaluationService {

    public static settings: Observable = fromObject(new Settings());

    constructor() { }

}
