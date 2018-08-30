import { Component, OnInit } from '@angular/core';
import { EvaluationService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
import * as app from 'tns-core-modules/application';
import { Evaluation } from '@maxmobility/core';

@Component({
  selector: 'Evals',
  moduleId: module.id,
  templateUrl: './evals.component.html'
})
export class EvalsComponent implements OnInit {
  evals: Evaluation[];
  constructor(private _evalService: EvaluationService) {}
  async ngOnInit() {
    console.log('EvalsComponent onInit');
    // load the evaluations for this user
    try {
      this.evals = await this._evalService.loadEvaluations();
      console.log('evals', this.evals);
    } catch (error) {
      console.log('ERROR', error);
    }
  }

  onEvalItemTap(event) {
    console.log(`Eval item tapped`, event);
  }
}
