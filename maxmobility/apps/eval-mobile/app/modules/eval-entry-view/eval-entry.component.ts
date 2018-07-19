import { Component, OnInit } from '@angular/core';
import { EvaluationService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
import * as app from 'tns-core-modules/application';

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
    private translateService: TranslateService
  ) {
    // make sure we clear out any previous evaluation info!
    this._evaluationService.createEvaluation();
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
      this.evaluation['pushing_pain'] = 0;
    }
  }

  onPushingFatigueChecked(args) {
    this.hasPushingFatigue = args.value;
    if (!this.hasPushingFatigue) {
      this.evaluation['pushing_fatigue'] = 0;
    }
  }

  onIndependenceChecked(args): void {
    this.impactsIndependence = args.value;
    if (!this.impactsIndependence) {
      this.evaluation['impact_on_independence'] = 0;
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
