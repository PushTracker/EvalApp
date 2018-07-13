import { Component } from '@angular/core';
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
import * as mustache from 'mustache';
import { Trial } from '@maxmobility/core';
import { Evaluation, EvaluationService } from '@maxmobility/mobile';

@Component({
  selector: 'Summary',
  moduleId: module.id,
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent {
  trialName: string = '';
  snackbar = new SnackBar();

  showFlatDifficulty: boolean = false;
  showRampDifficulty: boolean = false;
  showInclineDifficulty: boolean = false;
  showOtherDifficulty: boolean = false;

  hasFlatDifficulty: boolean = this.evaluation.flat_difficulty > 0;
  hasRampDifficulty: boolean = this.evaluation.ramp_difficulty > 0;
  hasInclineDifficulty: boolean = this.evaluation.incline_difficulty > 0;
  hasOtherDifficulty: boolean = this.evaluation.other_difficulty > 0;

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
    // update difficulties
    this.difficulties.map(d => {
      d.has = this.evaluation[d.key] > 0;
    });
    this.evaluation.trials.map(t => {
      if (t.flat) {
        this.difficulties.filter(d => d.name == 'Flat')[0].show = true;
      }
      if (t.ramp) {
        this.difficulties.filter(d => d.name == 'Ramp')[0].show = true;
      }
      if (t.inclines) {
        this.difficulties.filter(d => d.name == 'Incline')[0].show = true;
      }
      if (t.other) {
        this.difficulties.filter(d => d.name == 'Other')[0].show = true;
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

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  generateLMN(): string {
    const that = this;
    return mustache.render(this.lmnTemplate, {
      evaluation: this.evaluation,
      trials: this.evaluation.trials,
      totalCadenceWithout: this.totalCadenceWithout.toFixed(1),
      pushDiff: this.pushDiff.toFixed(0),
      coastDiff: this.coastDiff.toFixed(1),
      toFixed: function() {
        console.log(this);
        let str = this.toFixed(2);
        console.log(str);
        if (!str.length) str = '0';
        return str;
      },
      toTimeString: function() {
        return Trial.timeToString(this * 60);
      },
      pushComparison: function() {
        return this.pushDiff > 0 ? that.fewer : that.more;
      },
      coastComparison: function() {
        return this.coastDiff > 1.0 ? that.higher : that.lower;
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
    }).then(confirmResult => {
      if (confirmResult) {
        // send email to user
        email
          .available()
          .then(available => {
            if (available) {
              const lmnBody = this.generateLMN();
              email
                .compose({
                  to: [],
                  subject: this.summary_email_subject,
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
                .catch(error => console.error(error));
            }
          })
          .catch(error => console.error(error));
        this._evaluationService.save();
        // now go back to dashboard
        this.routerExtensions.navigate(['/home'], {
          // clearHistory: true,
          transition: {
            name: 'fade'
          }
        });
      }
    });
  }

  onDifficultyChecked(diff: any, args): void {
    diff.has = args.value;
    if (!diff.has) {
      this.evaluation[diff.key] = 0;
    }
  }

  onSliderUpdate(key, args) {
    this.evaluation[key] = args.object.value;
  }

  onBack(): void {
    this.routerExtensions.navigate(['/trial'], {
      // clearHistory: true,
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

  get evaluation() {
    return this._evaluationService.evaluation;
  }
}
