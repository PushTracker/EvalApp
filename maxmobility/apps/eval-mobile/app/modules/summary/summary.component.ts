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
import * as email from 'nativescript-email';
// app
import { Trial } from '@maxmobility/core';
import { Evaluation, EvaluationService } from '@maxmobility/mobile';

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

  generateLMN(): string {
    let lmnBody = [
      'This email was generated and sent by the Smart Evaluation App.',
      '',
      `User had pushing pain? ${this.evaluation.PushingPain}`,
      `                       ${this.evaluation.pain}`,
      `User had pushing fatigue? ${this.evaluation.PushingFatigue}`,
      `                       ${this.evaluation.fatigue}`,
      `Impact on user's independence: ${this.evaluation.independence}`
    ];
    let totalPushesWith = 0;
    let totalPushesWithout = 0;
    let totalTimeWith = 0;
    let totalTimeWithout = 0;
    this.evaluation.trials.map(t => {
      lmnBody.push('');
      lmnBody.push(`Trial "${t.name}":`);
      lmnBody.push(`  distance:   ${t.distance.toFixed(2)} m`);
      lmnBody.push(`  With SD:`);
      lmnBody.push(`    pushes: ${t.with_pushes}`);
      lmnBody.push(`    coast:  ${t.with_coast.toFixed(2)} s`);
      lmnBody.push(`    time:   ${Trial.timeToString(t.with_elapsed * 60)}`);
      lmnBody.push(`  Without SD:`);
      lmnBody.push(`    pushes: ${t.without_pushes}`);
      lmnBody.push(`    coast:  ${t.without_coast.toFixed(2)} s`);
      lmnBody.push(`    time:   ${Trial.timeToString(t.without_elapsed * 60)}`);
      lmnBody.push('');
      totalPushesWith += t.with_pushes;
      totalPushesWithout += t.without_pushes;
      totalTimeWith += t.with_elapsed;
      totalTimeWithout += t.without_elapsed;
    });
    lmnBody.push(`User's difficulty with ramps: ${this.evaluation.rampDifficulty}`);
    lmnBody.push(`User's difficulty with flats: ${this.evaluation.flatDifficulty}`);
    let totalCoastWith = totalPushesWith ? totalTimeWith * 60 / totalPushesWith : 0;
    let totalCoastWithout = totalPushesWithout ? totalTimeWithout * 60 / totalPushesWithout : 0;
    let totalCadenceWith = totalTimeWith ? totalPushesWith / totalTimeWith : 0;
    let totalCadenceWithout = totalTimeWithout ? totalPushesWithout / totalTimeWithout : 0;
    // pushes
    lmnBody.push('');
    let pushDiff = 100 - totalPushesWith / totalPushesWithout * 100;
    lmnBody.push(`User performed ${pushDiff.toFixed(0)}% ${pushDiff > 0 ? 'fewer' : 'more'} pushes with SmartDrive`);
    // coast
    lmnBody.push('');
    let coastDiff = totalCoastWith / totalCoastWithout * 100;
    lmnBody.push(
      `Average coast time was ${coastDiff.toFixed(0)}% ${coastDiff > 100 ? 'higher' : 'lower'} with SmartDrive`
    );
    // cadence
    lmnBody.push('');
    const cadenceThresh = 10;
    if (totalCadenceWithout > cadenceThresh) {
      lmnBody.push(
        `At ${totalCadenceWithout.toFixed(
          1
        )} pushes per minute, user's cadence is exceptionally high. Consider looking at rear wheel placement and efficient push technique.`
      );
    }
    return lmnBody.join('\n');
  }

  // button events
  onNext(): void {
    confirm({
      title: 'Complete Evaluation?',
      message: "Are you sure you're done with the evaluation?",
      okButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then(result => {
      if (result) {
        // send email to user
        email
          .available()
          .then(available => {
            console.log(`The device email status is ${available}`);
            if (available) {
              let lmnBody = this.generateLMN();
              email
                .compose({
                  to: [],
                  subject: 'Smart Evaluation LMN',
                  body: lmnBody,
                  cc: []
                })
                .then(result => {
                  console.log(result);
                  if (result) {
                    console.log('the email may have been sent!');
                  } else {
                    console.log('the email may NOT have been sent!');
                  }
                })
                .catch(error => console.error(error));
            }
          })
          .catch(error => console.error(error));
        // now go back to dashboard
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
    this.evaluation.set(key, args.object.value);
  }

  ngOnInit() {
    console.log('Summary.Component ngOnInit');
  }

  get evaluation(): Evaluation {
    return EvaluationService.evaluation;
  }
}
