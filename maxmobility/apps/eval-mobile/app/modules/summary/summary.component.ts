// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import * as switchModule from 'tns-core-modules/ui/switch';
import { RouterExtensions } from 'nativescript-angular/router';
import { SegmentedBar, SegmentedBarItem } from 'tns-core-modules/ui/segmented-bar';
import { TextField } from 'tns-core-modules/ui/text-field';
import { Observable } from 'tns-core-modules/data/observable';
import { confirm } from 'tns-core-modules/ui/dialogs';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
// app
import { EvaluationService } from '@maxmobility/mobile';

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

    constructor(private routerExtensions: RouterExtensions) {}

    // button events
    onNext(): void {
	confirm({
	    title: 'Complete Evaluation?',
	    message: "Are you sure you're done with the evaluation?",
	    okButtonText: 'Yes',
	    cancelButtonText: 'No'
	}).then(result => {
	    if (result) {
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

	console.log('onTextChange');
	this.trialName = textField.text;
    }

    onReturn(args) {
	const textField = <TextField>args.object;

	console.log('onReturn');
	this.trialName = textField.text;
    }

    showAlert(result) {
	alert('Text: ' + result);
    }

    submit(result) {
	alert('Text: ' + result);
    }

    onSliderUpdate(key, args) {
	this.settings.set(key, args.object.value);
    }

    ngOnInit() {
	console.log('Summary.Component ngOnInit');
    }

    get settings(): Observable {
	return EvaluationService.settings;
    }
}
