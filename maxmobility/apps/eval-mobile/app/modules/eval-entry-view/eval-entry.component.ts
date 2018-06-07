import * as app from 'tns-core-modules/application';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SegmentedBar, SegmentedBarItem } from 'tns-core-modules/ui/segmented-bar';
import { Observable } from 'tns-core-modules/data/observable';
import { confirm } from 'tns-core-modules/ui/dialogs';
import { Evaluation, EvaluationService } from '@maxmobility/mobile';
import { RouterExtensions } from 'nativescript-angular/router';
import { DropDownModule } from 'nativescript-drop-down/angular';

@Component({
  selector: 'EvalEntry',
  moduleId: module.id,
  templateUrl: './eval-entry.component.html',
  styleUrls: ['./eval-entry.component.css']
})
export class EvalEntryComponent implements OnInit {
  hasPushingPain = false;
  hasPushingFatigue = false;

  isIOS = false;
  isAndroid = false;

  years = ['1', '2', '3', '4', '5+', '10+', '20+', '30+'];
  chair = ['TiLite', 'Quckie', 'Other'];

  constructor(private routerExtensions: RouterExtensions, private _evaluationService: EvaluationService) {
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

  onDrawerButtonTap(): void {}
}
