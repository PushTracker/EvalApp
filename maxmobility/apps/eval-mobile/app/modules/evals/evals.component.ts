import { Component, OnInit } from '@angular/core';
import { Evaluation } from '@maxmobility/core';
import { EvaluationService } from '@maxmobility/mobile';

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
  evals: Evaluation[];

  /**
   * Boolean to track when the evals have loaded.
   * Used to hide the activity indicator in UI and show the list.
   */
  evalsLoaded = false;

  constructor(private _evalService: EvaluationService) {}

  async ngOnInit() {
    console.log('EvalsComponent onInit');
    // load the evaluations for this user
    try {
      this.evals = await this._evalService.loadEvaluations();
      this.evalsLoaded = true;
      console.log('evals', this.evals);
    } catch (error) {
      this.evalsLoaded = true;
      console.log('ERROR', error);
    }
  }

  onEvalItemTap(event) {
    console.log(`Eval item tapped`);
  }
}
