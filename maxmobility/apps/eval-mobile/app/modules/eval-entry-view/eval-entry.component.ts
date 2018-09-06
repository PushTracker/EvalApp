import { Component, OnInit } from '@angular/core';
import { Evaluation } from '@maxmobility/core';
import { EvaluationService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
import * as app from 'tns-core-modules/application';
import { confirm } from 'tns-core-modules/ui/dialogs';

@Component({
  selector: 'EvalEntry',
  moduleId: module.id,
  templateUrl: './eval-entry.component.html',
  styleUrls: ['./eval-entry.component.css']
})
export class EvalEntryComponent implements OnInit {
  hasPushingPain = false;
  hasPushingFatigue = false;
  impactsIndependence = false;

  isIOS = false;
  isAndroid = false;

  years = ['1', '2', '3', '4', '5+', '10+', '20+', '30+'];
  chair = ['TiLite', 'Quickie', 'Other'];

  constructor(
    private routerExtensions: RouterExtensions,
    private _evaluationService: EvaluationService,
    private _translateService: TranslateService
  ) {
    // make sure we clear out any previous evaluation info!
    if (this.evaluation !== null) {
      setTimeout(() => {
        console.log('the evaluation is not complete');
        confirm({
          message: 'You have an evaluation that has not been completed. Would you like to continue working on it?',
          okButtonText: 'Yes',
          cancelButtonText: 'No'
        }).then(result => {
          console.log('confirm result', result);
          if (result === true) {
            console.log('need to load the last data set on the evaluation...');
            console.log(this.evaluation);
            // we have the data on the `evaluation` on the service so just let it load
            // we have to check the toggles bc we have props here that set them false when the component loads ^^^
            this.hasPushingFatigue = this.evaluation.pushing_fatigue ? true : false;
            this.hasPushingPain = this.evaluation.pushing_pain ? true : false;
            this.impactsIndependence = this.evaluation.impact_on_independence ? true : false;
          } else {
            this._evaluationService.evaluation = new Evaluation();
          }
        });
      }, 650);
    } else {
      this._evaluationService.evaluation = new Evaluation();
    }
  }

  onSliderUpdate(key, args) {
    this.evaluation[key] = args.object.value;
  }

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/training']);
  }

  // listPicker events
  selectedIndexChanged(key, args) {
    const newValue = this[key][args.newIndex];
    this.evaluation[key] = newValue;
  }

  onPushingPainChecked(args): void {
    this.hasPushingPain = args.value;
    if (!this.hasPushingPain) {
      this.evaluation.pushing_pain = 0;
    }
  }

  onPushingFatigueChecked(args) {
    this.hasPushingFatigue = args.value;
    if (!this.hasPushingFatigue) {
      this.evaluation.pushing_fatigue = 0;
    }
  }

  onIndependenceChecked(args): void {
    this.impactsIndependence = args.value;
    if (!this.impactsIndependence) {
      this.evaluation.impact_on_independence = 0;
    }
  }

  ngOnInit(): void {
    if (app.ios) {
      this.isIOS = true;
    } else if (app.android) {
      this.isAndroid = true;
    }
  }

  get evaluation() {
    return this._evaluationService.evaluation;
  }
}
