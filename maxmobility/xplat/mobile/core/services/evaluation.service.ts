import { Injectable } from '@angular/core';

import { fromObject, Observable } from 'tns-core-modules/data/observable';

export class Settings {
  // public members
  PushingPain = 'Yes';
  PushingFatigue = 'Yes';

  pain = 3;
  fatigue = 7;
  independence = 10;

  maxSpeed = 50;
  accelerationRate = 30;

  pushCount = 0;
  coastTime = 0.0;
  trialDistance = 0.0;
  trialTime = 0.0;
  pushesPercentDifference = 0.0;
  coastPercentDifference = 0.0;

  rampDifficulty = 0.0;
  flatDifficulty = 0.0;

  // private members

  // functions

  constructor(obj?: any) {
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

  fromObject(obj: any) {
    this.PushingPain = (obj && obj.PushingPain) || 'Yes';
    this.PushingFatigue = (obj && obj.PushingFatigue) || 'Yes';

    this.pain = (obj && obj.pain) || 3;
    this.fatigue = (obj && obj.fatigue) || 7;
    this.independence = (obj && obj.independence) || 10;

    this.maxSpeed = (obj && obj.maxSpeed) || 50;
    this.accelerationRate = (obj && obj.accelerationRate) || 30;
    this.rampDifficulty = (obj && obj.rampDifficulty) || 0;
    this.flatDifficulty = (obj && obj.flatDifficulty) || 0;
  }
}

@Injectable()
export class EvaluationService {
  static settings: Observable = fromObject(new Settings());

  constructor() {}
}
