import { Injectable } from '@angular/core';

import { fromObject, Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

import { Trial } from '@maxmobility/core';

export class Evaluation extends Observable {
  // public members
  PushingPain = 'Yes';
  PushingFatigue = 'Yes';

  pain = 3;
  fatigue = 7;
  independence = 10;

  rampDifficulty = 0.0;
  flatDifficulty = 0.0;

  trials: ObservableArray<Trial> = new ObservableArray();

  // private members

  // functions

  constructor(obj?: any) {
    super();
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

    this.rampDifficulty = (obj && obj.rampDifficulty) || 0.0;
    this.flatDifficulty = (obj && obj.flatDifficulty) || 0.0;
  }
}

@Injectable()
export class EvaluationService {
  static evaluation: Evaluation = new Evaluation();

  constructor() {}
}
