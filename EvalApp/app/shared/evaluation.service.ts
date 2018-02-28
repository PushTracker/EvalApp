import { Injectable } from "@angular/core";

import { fromObject, Observable } from "data/observable";

export class Settings {
    // public members
    PushingPain: string = "Yes";
    PushingFatigue: string = "Yes";

    pain: number = 30;
    fatigue: number = 70;
    independence: number = 100;

    maxSpeed: number = 50;
    accelerationRate: number = 30;

    pushCount: number = 0;
    coastTime: number = 0.0;
    trialDistance: number = 0.0;
    trialTime: number = 0.0;
    pushesPercentDifference: number = 0.0;
    coastPercentDifference: number = 0.0;


    // private members

    // functions

    constructor(obj?: any) {
        if (obj !== null && obj !== undefined) {
            this.fromObject(obj);
        }
    }

    fromObject(obj: any): void {
        this.PushingPain = obj && obj.PushingPain || "Yes";
        this.PushingFatigue = obj && obj.PushingFatigue || "Yes";

        this.pain = obj && obj.pain || 30;
        this.fatigue = obj && obj.fatigue || 70;
        this.independence = obj && obj.independence || 100;

        this.maxSpeed = obj && obj.pain || 50;
        this.accelerationRate = obj && obj.fatigue || 30;
    }
}

@Injectable()
export class EvaluationService {

    static settings: Observable = fromObject(new Settings());

    constructor() { }

}
