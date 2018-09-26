import { Component, OnInit } from '@angular/core';
import { Evaluation } from '@maxmobility/core';
import { EvaluationService } from '@maxmobility/mobile';
import { alert } from 'tns-core-modules/ui/dialogs/dialogs';
import { SearchBar } from 'tns-core-modules/ui/search-bar';
import { TranslateService } from '@ngx-translate/core';
import { ModalDatetimepicker } from 'nativescript-modal-datetimepicker';

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

  private _picker = new ModalDatetimepicker();

  constructor(private _evalService: EvaluationService, private _translateService: TranslateService) {}

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
      console.log('ERROR ', error);
      alert({
        message: this._translateService.instant('evals.evals-loading-error'),
        okButtonText: this._translateService.instant('dialogs.ok')
      });
    }
  }

  onSearchTap() {
    console.log('onSearchTap');
    this._picker
      .pickDate({
        title: 'Select Your Birthday',
        theme: 'light',
        maxDate: new Date(),
        is24HourView: false
      })
      .then((result: any) => {
        // Note the month is 1-12 (unlike js which is 0-11)
        console.log('Date is: ' + result.day + '-' + result.month + '-' + result.year);
        const jsdate = new Date(result.year, result.month - 1, result.day);
        console.log(jsdate);
      })
      .catch(error => {
        console.log('Error: ' + error);
      });
  }

  onSubmit(args) {
    const searchBar = args.object as SearchBar;
    alert('You are searching for ' + searchBar.text);
  }

  onTextChanged(args) {
    const searchBar = args.object as SearchBar;
    console.log('SearchBar text changed! New value: ' + searchBar.text);
  }

  onEvalItemTap(event) {
    console.log(`Eval item tapped`);
  }
}
