import { Component, OnInit } from '@angular/core';
import { Evaluation } from '@maxmobility/core';
import { EvaluationService } from '@maxmobility/mobile';
import { alert } from 'tns-core-modules/ui/dialogs/dialogs';

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
      this.evals.forEach(item => {
        console.log('eval', item);
      });
    } catch (error) {
      this.evalsLoaded = true;
      console.log('ERROR', error);
      alert({
        message: 'An error occurred loading the evaluations.',
        okButtonText: 'Okay'
      });
    }
  }

  onEvalItemTap(event) {
    console.log(`Eval item tapped`);
  }
}
