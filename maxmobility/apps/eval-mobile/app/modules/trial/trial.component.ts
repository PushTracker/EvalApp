// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { RouterExtensions } from 'nativescript-angular/router';
import { SegmentedBar, SegmentedBarItem } from 'tns-core-modules/ui/segmented-bar';
import { TextField } from 'tns-core-modules/ui/text-field';
import { confirm } from 'tns-core-modules/ui/dialogs';
import * as switchModule from 'tns-core-modules/ui/switch';
import { Observable } from 'tns-core-modules/data/observable';

// app
import { EvaluationService } from '@maxmobility/mobile';

import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';

@Component({
  selector: 'Trial',
  moduleId: module.id,
  templateUrl: './trial.component.html',
  styleUrls: ['./trial.component.css']
})
export class TrialComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  trialName: string = '';

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private routerExtensions: RouterExtensions) {}

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/summary'], {
      clearHistory: true,
      transition: {
        name: 'slide'
      }
    });
  }

  onBack(): void {
    this.routerExtensions.navigate(['/training'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  onStartTrial() {
    const options: SnackBarOptions = {
      actionText: 'Connect',
      snackText: 'Please connect to SmartDrive',
      hideDelay: 10000
    };

    this.snackbar.action(options).then(args => {
      if (args.command === 'Action') {
        confirm({
          title: 'Connecting...',
          message: 'Please make sure SmartDrive is on.',
          okButtonText: 'It Is',
          cancelButtonText: 'Whoops'
        }).then(result => {
          if (result) {
            // tslint:disable-next-line:no-shadowed-variable
            this.snackbar.simple('Connecting to SmartDrive.', 'red', '#fff').then(args => {
              // connect()
            });
          } else {
            // tslint:disable-next-line:no-shadowed-variable
            this.snackbar.simple('Connecting to SmartDrive', 'red', '#fff').then(args => {
              // connect()
            });
          }
        });
      } else {
        // dismiss
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

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  get settings(): Observable {
    return EvaluationService.settings;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
