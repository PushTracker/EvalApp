// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { isAndroid, isIOS } from 'platform';
import * as switchModule from 'tns-core-modules/ui/switch';
import { RouterExtensions } from 'nativescript-angular/router';
import { SegmentedBar, SegmentedBarItem } from 'tns-core-modules/ui/segmented-bar';
import { TextField } from 'tns-core-modules/ui/text-field';
import { Observable } from 'tns-core-modules/data/observable';
import { confirm } from 'tns-core-modules/ui/dialogs';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import * as email from 'nativescript-email';
import { TranslateService } from '@ngx-translate/core';
// libs
import * as mustache from 'mustache';
// app
import { Trial } from '@maxmobility/core';
import { Evaluation, EvaluationService } from '@maxmobility/mobile';

@Component({
  selector: 'Summary',
  moduleId: module.id,
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit {
  trialName: string = '';
  snackbar = new SnackBar();

  hasFlatDifficulty: boolean = false;
  hasRampDifficulty: boolean = false;

  totalPushesWith: number = 0;
  totalPushesWithout: number = 0;
  totalTimeWith: number = 0;
  totalTimeWithout: number = 0;
  totalCoastWith: number = 0;
  totalCoastWithout: number = 0;
  totalCadenceWith: number = 0;
  totalCadenceWithout: number = 0;

  pushDiff: number = 0;
  coastDiff: number = 0;

  cadenceThresh = 10; // pushes per minute

  error: string = this._translateService.instant('user.error');
  ok: string = this._translateService.instant('dialogs.ok');
  yes: string = this._translateService.instant('dialogs.yes');
  no: string = this._translateService.instant('dialogs.no');
  complete: string = this._translateService.instant('summary.complete');
  confirm: string = this._translateService.instant('summary.confirm');
  summary_email_subject: string = this._translateService.instant('summary.email-subject');
  fewer: string = this._translateService.instant('summary.fewer');
  more: string = this._translateService.instant('summary.more');
  higher: string = this._translateService.instant('summary.higher');
  lower: string = this._translateService.instant('summary.lower');
  lmnTemplate: string = this._translateService.instant('summary.lmnTemplate').join('\n');

  constructor(
    private routerExtensions: RouterExtensions,
    private _evaluationService: EvaluationService,
    private _translateService: TranslateService
  ) {
    this.evaluation.trials.map(t => {
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

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  generateLMN(): string {
    return mustache.render(this.lmnTemplate, {
      evaluation: this.evaluation,
      trials: this.evaluation.trials,
      totalCadenceWithout: this.totalCadenceWithout.toFixed(1),
      pushDiff: this.pushDiff.toFixed(0),
      coastDiff: this.coastDiff.toFixed(1),
      toFixed: function() {
        return this.toFixed(2) || '0';
      },
      toTimeString: function() {
        return Trial.timeToString(this * 60);
      },
      pushComparison: function() {
        return this.pushDiff > 0 ? this.fewer : this.more;
      },
      coastComparison: function() {
        return this.coastDiff > 1.0 ? this.higher : this.lower;
      },
      showCadence: this.totalCadenceWithout > this.cadenceThresh
    });
  }

  // button events
  onNext(): void {
    confirm({
      title: this.complete,
      message: this.confirm,
      okButtonText: this.yes,
      cancelButtonText: this.no
    }).then(result => {
      if (result) {
        // send email to user
        email
          .available()
          .then(available => {
            console.log(`The device email status is ${available}`);
            if (available) {
              let lmnBody = this.generateLMN();
              email
                .compose({
                  to: [],
                  subject: this.summary_email_subject,
                  body: lmnBody,
                  cc: []
                })
                .then(result => {
                  console.log(result);
                  if (result) {
                    console.log('the email may have been sent!');
                  } else {
                    console.log('the email may NOT have been sent!');
                  }
                })
                .catch(error => console.error(error));
            }
          })
          .catch(error => console.error(error));
        this._evaluationService.save();
        // now go back to dashboard
        this.routerExtensions.navigate(['/home'], {
          clearHistory: true,
          transition: {
            name: 'fade'
          }
        });
      }
    });
  }

  onRampDifficultyChecked(args): void {
    this.hasRampDifficulty = args.value;
  }

  onFlatDifficultyChecked(args): void {
    this.hasFlatDifficulty = args.value;
  }

  onBack(): void {
    this.routerExtensions.navigate(['/trial'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  onTextChange(args) {
    const textField = <TextField>args.object;
    this.trialName = textField.text;
  }

  onReturn(args) {
    const textField = <TextField>args.object;
    this.trialName = textField.text;
  }

  onSliderUpdate(key, args) {
    this.evaluation[key] = args.object.value;
  }

  ngOnInit() {
    console.log('Summary.Component ngOnInit');
  }

  get evaluation() {
    return this._evaluationService.evaluation;
  }
}
