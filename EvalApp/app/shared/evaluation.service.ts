import { Injectable } from '@angular/core';

import { Observable, fromObject } from "data/observable";

export class Settings {
    // public members
    public ezOn: boolean = false;
    public acceleration: number = 30;
    public maxSpeed: number = 70;
    public tapSensitivity: number = 100;

    // private members

    // functions

    constructor(obj?: any) {
	if (obj !== null && obj !== undefined) {
	    this.fromObject(obj);
	}
    }

    public fromObject(obj: any): void {
	this.ezOn = obj && obj.ezOn || false;
	this.acceleration = obj && obj.acceleration || 30;
	this.maxSpeed = obj && obj.maxSpeed || 70;
	this.tapSensitivity = obj && obj.tapSensitivity || 100;
    }
}

@Injectable()
export class EvaluationService {

    public static settings: Observable = fromObject(new Settings());

    constructor() { }

}
