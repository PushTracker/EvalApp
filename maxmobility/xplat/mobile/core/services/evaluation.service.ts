import { Injectable, NgZone } from '@angular/core';
import { Response } from '@angular/http';
import { Trial } from '@maxmobility/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

export class Evaluation extends Observable {
  // public members
  _id = null;
  pushing_pain = 0;
  pushing_fatigue = 0;
  impact_on_independence = 0;
  flat_difficulty = 0.0;
  ramp_difficulty = 0.0;
  incline_difficulty = 0.0;
  other_difficulty = 0.0;
  years = '';
  chair = '';
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
    Object.assign(this, obj);
  }

  data(): any {
    var obj = {
      trials: []
    };
    Object.keys(this).map(k => {
      if (typeof this[k] === 'number' || typeof this[k] === 'string') {
        obj[k] = this[k];
      }
    });
    this.trials.map(t => {
      obj.trials.push(t.data());
    });
    return obj;
  }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class EvaluationService {
  evaluation: Evaluation = new Evaluation();

  private datastore = Kinvey.DataStore.collection<Evaluation>('Evaluations');

  constructor(private zone: NgZone) {}

  // tslint:disable-next-line:member-ordering
  createEvaluation() {
    this.evaluation = new Evaluation();
  }

  save() {
    return this.datastore
      .save(this.evaluation.data())
      .then(data => {
        // now that we've saved the eval, clear it out
        this.createEvaluation();
      })
      .catch(this.handleErrors);
  }

  private handleErrors(error: Response) {
    console.log(error);
  }
}
