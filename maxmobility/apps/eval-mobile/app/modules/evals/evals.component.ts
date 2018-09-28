import { Component, OnInit } from '@angular/core';
import { Evaluation, Trial } from '@maxmobility/core';
import { EvaluationService, LoggingService } from '@maxmobility/mobile';
import { alert, confirm } from 'tns-core-modules/ui/dialogs/dialogs';
import { TranslateService } from '@ngx-translate/core';
import { ModalDatetimepicker, DateResponse } from 'nativescript-modal-datetimepicker';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { Toasty } from 'nativescript-toasty';
import * as email from 'nativescript-email';
import * as mustache from 'mustache';

@Component({
  selector: 'Evals',
  moduleId: module.id,
  templateUrl: './evals.component.html',
  styleUrls: ['./evals.component.css']
})
export class EvalsComponent implements OnInit {
  /**
   * Evals array binded to the listview.
   */
  evals: Evaluation[] = [];

  /**
   * Boolean to track when the evals have loaded.
   * Used to hide the activity indicator in UI and show the list.
   */
  evalsLoaded = false;

  /*** LMN PROPS  ***/
  difficulties = [
    {
      name: 'Flat',
      key: 'flat_difficulty',
      labelText: 'summary.difficulty-flat',
      sliderLabelText: 'summary.flat-surface-difficulty',
      has: false,
      show: false
    },
    {
      name: 'Ramp',
      key: 'ramp_difficulty',
      labelText: 'summary.difficulty-ramp',
      sliderLabelText: 'summary.ramp-difficulty',
      has: false,
      show: false
    },
    {
      name: 'Incline',
      key: 'incline_difficulty',
      labelText: 'summary.difficulty-incline',
      sliderLabelText: 'summary.incline-difficulty',
      has: false,
      show: false
    },
    {
      name: 'Other',
      key: 'other_difficulty',
      labelText: 'summary.difficulty-other',
      sliderLabelText: 'summary.other-surface-difficulty',
      has: false,
      show: false
    }
  ];

  totalPushesWith = 0;
  totalPushesWithout = 0;
  totalTimeWith = 0;
  totalTimeWithout = 0;
  totalCoastWith = 0;
  totalCoastWithout = 0;
  totalCadenceWith = 0;
  totalCadenceWithout = 0;
  pushDiff = 0;
  coastDiff = 0;
  cadenceThresh = 10; // pushes per minute
  lmnTemplate: string = this._translateService.instant('summary.lmnTemplate').join('\n');

  /*** LMN PROPS  ***/

  private _initialEvals: Evaluation[] = null;

  private _picker = new ModalDatetimepicker();
  private _datastore = Kinvey.DataStore.collection<Evaluation>('Evaluations');

  constructor(
    private _evalService: EvaluationService,
    private _translateService: TranslateService,
    private _loggingService: LoggingService
  ) {}

  async ngOnInit() {
    console.log('EvalsComponent onInit');
    // load the evaluations for this user
    try {
      this.evals = await this._evalService.loadEvaluations();
      this._initialEvals = this.evals; // setting the initial evals so during searches we can default back to full list data
      this.evalsLoaded = true;
      this.evals.forEach(item => {
        console.log('eval', item);
      });
    } catch (error) {
      this.evalsLoaded = true;
      console.log('ERROR ', error);
      alert({
        message: this._translateService.instant('evals.evals-loading-error'),
        okButtonText: this._translateService.instant('dialogs.ok')
      });
    }
  }

  async onSearchTap() {
    try {
      console.log('onSearchTap');
      const dateResult = (await this._picker.pickDate({
        title: 'Select Eval Date',
        theme: 'dark',
        maxDate: new Date(),
        is24HourView: false
      })) as DateResponse;

      const jsdate = new Date(dateResult.year, dateResult.month - 1, dateResult.day);

      // now query Kinvey evals for only current logged in user for the date selected
      const query = new Kinvey.Query();
      query
        .greaterThanOrEqualTo('_kmd.ect', jsdate.toISOString())
        .equalTo('_acl.creator', Kinvey.User.getActiveUser()._id);

      const stream = this._datastore.find(query);
      const data = await stream.toPromise();
      console.log('data', data, data.length);

      if (!data || data.length <= 0) {
        new Toasty(`No Evaluations found for date ${dateResult.month}/${dateResult.day}/${dateResult.year}`).show();
        this.evals = this._initialEvals;
        return;
      }

      if (data && data.length >= 1) {
        data.forEach(item => {
          console.log('eval', item);
        });

        // assign the evals to bind to listview items
        this.evals = data;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onEmailBtnTap(evaluation: Evaluation) {
    console.log('evaluation email tapped', evaluation);
    const confirmResult = await confirm({
      title: this._translateService.instant('evals.confirm-lmn-email-title'),
      message: this._translateService.instant('evals.confirm-lmn-email-message'),
      okButtonText: this._translateService.instant('dialogs.yes'),
      cancelButtonText: this._translateService.instant('dialogs.no')
    });

    if (!confirmResult) {
      console.log('confirmation was denied');
      return;
    }

    // send email to user
    const isAvailable = await email.available();
    if (!isAvailable) {
      console.log('Email is not available on device.');
      return;
    }

    // need to generate the LMN report with email app opening to send it out

    this._updateEvalForLmnReport(evaluation);

    const lmnBody = this._generateLMN(evaluation);
    console.log('lmnBody', lmnBody);
    email
      .compose({
        to: [],
        subject: this._translateService.instant('summary.email-subject'),
        body: lmnBody,
        cc: []
      })
      .then(result => {
        if (result) {
          console.log('email compose result', result);
        } else {
          console.log('the email may NOT have been sent!');
        }
      })
      .catch(error => {
        this._loggingService.logException(error);
        console.error(error);
      });
  }

  onEvalItemTap(event) {
    console.log(`Eval item tapped`);
  }

  private _updateEvalForLmnReport(evaluation: Evaluation) {
    // update difficulties
    this.difficulties.map(d => {
      d.has = evaluation[d.key] > 0;
    });

    evaluation.trials.map(t => {
      if (t.flat) {
        this.difficulties.filter(d => d.name === 'Flat')[0].show = true;
      }
      if (t.ramp) {
        this.difficulties.filter(d => d.name === 'Ramp')[0].show = true;
      }
      if (t.inclines) {
        this.difficulties.filter(d => d.name === 'Incline')[0].show = true;
      }
      if (t.other) {
        this.difficulties.filter(d => d.name === 'Other')[0].show = true;
      }
      this.totalPushesWith += t.with_pushes;
      this.totalPushesWithout += t.without_pushes;
      this.totalTimeWith += t.with_elapsed;
      this.totalTimeWithout += t.without_elapsed;
    });
    this.totalCoastWith = this.totalPushesWith ? (this.totalTimeWith * 60) / this.totalPushesWith : 0;
    this.totalCoastWithout = this.totalPushesWithout ? (this.totalTimeWithout * 60) / this.totalPushesWithout : 0;
    this.totalCadenceWith = this.totalTimeWith ? this.totalPushesWith / this.totalTimeWith : 0;
    this.totalCadenceWithout = this.totalTimeWithout ? this.totalPushesWithout / this.totalTimeWithout : 0;
    // pushes
    this.pushDiff = 100 - (this.totalPushesWith / this.totalPushesWithout) * 100 || 0;
    // coast
    this.coastDiff = this.totalCoastWith / this.totalCoastWithout || 0;
  }

  private _generateLMN(evaluation: Evaluation): string {
    // const that = this;
    return mustache.render(this.lmnTemplate, {
      evaluation,
      trials: evaluation.trials,
      totalCadenceWithout: this.totalCadenceWithout.toFixed(1),
      pushDiff: this.pushDiff.toFixed(0),
      coastDiff: this.coastDiff.toFixed(1),
      // tslint:disable-next-line:object-literal-shorthand
      toFixed: function() {
        console.log(this);
        let str = this.toFixed(2);
        console.log(str);
        if (!str.length) {
          str = '0';
        }
        return str;
      },
      // tslint:disable-next-line:object-literal-shorthand
      toTimeString: function() {
        return Trial.timeToString(this * 60);
      },
      pushComparison: () => {
        return this.pushDiff > 0
          ? this._translateService.instant('summary.fewer')
          : this._translateService.instant('summary.more');
      },
      coastComparison: () => {
        return this.coastDiff > 1.0
          ? this._translateService.instant('summary.higher')
          : this._translateService.instant('summary.lower');
      },
      showCadence: this.totalCadenceWithout > this.cadenceThresh
    });
  }
}
