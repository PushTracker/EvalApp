import { Component, OnInit } from '@angular/core';
import { Evaluation } from '@maxmobility/core';
import { EvaluationService } from '@maxmobility/mobile';
import { alert } from 'tns-core-modules/ui/dialogs/dialogs';
import { SearchBar } from 'tns-core-modules/ui/search-bar';
import { TranslateService } from '@ngx-translate/core';
import { ModalDatetimepicker, DateResponse } from 'nativescript-modal-datetimepicker';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { Toasty } from 'nativescript-toasty';

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

  private _initialEvals: Evaluation[] = null;

  private _picker = new ModalDatetimepicker();
  private _datastore = Kinvey.DataStore.collection<Evaluation>('Evaluations');

  constructor(private _evalService: EvaluationService, private _translateService: TranslateService) {}

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
