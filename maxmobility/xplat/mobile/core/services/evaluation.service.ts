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
  ramp_difficulty = 0.0;
  flat_difficulty = 0.0;
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

  // tslint:disable-next-line:member-ordering
  createEvaluation() {
    this.evaluation = new Evaluation();
    /*
    return this.datastore
      .save({})
      .then(data => {
        this.updateEvaluation(data);
        this.publishUpdates();
      })
      .catch(this.handleErrors);
        */
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

  private publishUpdates() {}

  private handleErrors(error: Response) {
    console.log(error);
  }
}
