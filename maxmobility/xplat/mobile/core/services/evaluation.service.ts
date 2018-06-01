import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, Response, ResponseOptions } from '@angular/http';
//import { Observable } from "rxjs/Observable";
//import { BehaviorSubject } from "rxjs/BehaviorSubject";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { Kinvey } from 'kinvey-nativescript-sdk';

import { fromObject, Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

import { Trial } from '@maxmobility/core';

export class Evaluation extends Observable {
  // public members
  public _id = null;

  public pushing_pain: number = 0;
  public pushing_fatigue: number = 0;
  public impact_on_independence: number = 0;
  public ramp_difficulty: number = 0.0;
  public flat_difficulty: number = 0.0;
  public years: string = '';
  public chair: string = '';

  public trials: ObservableArray<Trial> = new ObservableArray();

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
    console.log(obj);
    return obj;
  }
}

@Injectable()
export class EvaluationService {
  evaluation: Evaluation = new Evaluation();

  private datastore = Kinvey.DataStore.collection<Evaluation>('Evaluations');

  constructor(private zone: NgZone) {}

  private updateEvaluation(_eval) {
    this.evaluation = new Evaluation({
      _id: _eval._id,
      pushing_pain: _eval.pushing_pain,
      pushing_fatigue: _eval.pushing_fatigue,
      impact_on_independence: _eval.impact_on_independence,
      ramp_difficulty: _eval.ramp_difficulty,
      flat_difficulty: _eval.flat_difficulty
    });
    _eval.trials.forEach(trial => {
      this.evaluation.trials.push(
        new Trial({
          _id: trial._id,

          name: trial.name,
          flat: trial.flat,
          ramap: trial.ramap,
          inclines: trial.inclines,
          other: trial.other,
          max_speed: trial.max_speed,
          acceleration: trial.acceleration,
          startedWith: trial.startedWith,
          startedWithout: trial.startedWithout,
          finishedWith: trial.finishedWith,
          finishedWithout: trial.finishedWithout,
          distance: trial.distance,
          with_pushes: trial.with_pushes,
          with_coast: trial.with_coast,
          with_distance: trial.with_distance,
          with_start: trial.with_start,
          with_end: trial.with_end,
          with_elapsed: trial.with_elapsed,
          without_pushes: trial.without_pushes,
          without_coast: trial.without_coast,
          without_distance: trial.without_distance,
          without_start: trial.without_start,
          without_end: trial.without_end,
          without_elapsed: trial.without_elapsed
        })
      );
    });
  }

  createEvaluation() {
    return this.datastore
      .save({})
      .then(data => {
        this.updateEvaluation(data);
        this.publishUpdates();
      })
      .catch(this.handleErrors);
  }

  save() {
    return this.datastore
      .save(this.evaluation.data())
      .then(data => {
        this.updateEvaluation(data);
        this.publishUpdates();
      })
      .catch(this.handleErrors);
  }

  load() {
    const promise = Promise.resolve();
    return promise
      .then(() => {
        var stream = this.datastore.find();
        return stream.toPromise();
      })
      .then(data => {
        data.forEach(_eval => {
          this.updateEvaluation(_eval);
          this.publishUpdates();
        });
      })
      .catch(error => {
        this.handleErrors;
      });
  }

  private put(data: Object) {
    return this.datastore.save(data).catch(this.handleErrors);
  }

  private publishUpdates() {
    /*
        // Make sure all updates are published inside NgZone so that
        // change detection is triggered if needed
        this.zone.run(() => {
            // must emit a *new* value (immutability!)
            const _eval = new Evaluation(this._evaluation);
            this.evaluation.next(_eval);
        });
        */
  }

  private handleErrors(error: Response) {
    console.log(error);
    return Observable.throw(error);
  }
}
