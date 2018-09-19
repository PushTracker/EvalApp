import { Injectable, NgZone } from '@angular/core';
import { Response } from '@angular/http';
import { Evaluation } from '@maxmobility/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { LoggingService } from './logging.service';

@Injectable()
export class EvaluationService {
  evaluation: Evaluation = null;
  private datastore = Kinvey.DataStore.collection<Evaluation>('Evaluations');

  constructor(private _logService: LoggingService, private zone: NgZone) {}

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

  async loadEvaluations(): Promise<any> {
    try {
      await this.login();
      await this.datastore.sync();
      const query = new Kinvey.Query();
      query.equalTo('creator_id', Kinvey.User.getActiveUser()._id);

      const stream = this.datastore.find(query);
      const data = await stream.toPromise();
      console.log(data);
      return data;
    } catch (error) {
      this._logService.logException(error);
    }
  }

  private login(): Promise<any> {
    if (!!Kinvey.User.getActiveUser()) {
      return Promise.resolve();
    } else {
      return Promise.reject('No active user!');
    }
  }

  private handleErrors(error: Response) {
    console.log(error);
  }
}
