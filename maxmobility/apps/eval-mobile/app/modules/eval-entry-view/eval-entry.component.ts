import * as app from 'tns-core-modules/application';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { SegmentedBar, SegmentedBarItem } from 'tns-core-modules/ui/segmented-bar';
import { Observable } from 'tns-core-modules/data/observable';
import { confirm } from 'tns-core-modules/ui/dialogs';
import { Evaluation, EvaluationService } from '@maxmobility/mobile';
import { RouterExtensions } from 'nativescript-angular/router';
import { DropDownModule } from 'nativescript-drop-down/angular';

const timeInChair = ['1', '2', '3', '4', '5+', '10+', '20+', '30+'];
const chairType = ['TiLite', 'Quckie', 'Other'];

@Component({
  selector: 'EvalEntry',
  moduleId: module.id,
  templateUrl: './eval-entry.component.html',
  styleUrls: ['./eval-entry.component.css']
})
export class EvalEntryComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  yesNo: SegmentedBarItem[] = [];
  PushingPain: SegmentedBarItem[] = [];
  PushingFatigue: SegmentedBarItem[] = [];

  isIOS = false;
  isAndroid = false;

  timeFrames: string[];
  timeIndex = 0;
  chairTypes: string[];
  chairIndex = 0;
  private _sideDrawerTransition: DrawerTransitionBase;
  private pains = ['Yes', 'No'];
  private fatigues = ['Yes', 'No'];

  constructor(private routerExtensions: RouterExtensions) {
    this.pains.map(o => {
      const item = new SegmentedBarItem();
      item.title = o;
      this.PushingPain.push(item);
    });
    this.fatigues.map(o => {
      const item = new SegmentedBarItem();
      item.title = o;
      this.PushingFatigue.push(item);
    });

    this.timeFrames = [];

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < timeInChair.length; i++) {
      this.timeFrames.push(timeInChair[i]);
    }

    this.chairTypes = [];

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < chairType.length; i++) {
      this.chairTypes.push(chairType[i]);
    }
  }

  onSliderUpdate(key, args) {
    this.evaluation.set(key, args.object.value);
  }

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/training']);
  }

  // listPicker events
  selectedIndexChanged(args) {
    console.log('selected index changed', args);
  }

  // pushing pain
  getPushingPainIndex() {
    return this.pains.indexOf(this.evaluation.get('PushingPain'));
  }

  onPushingPainIndexChange(args): void {
    const segmentedBar = <SegmentedBar>args.object;
    this.evaluation.set('PushingPain', this.pains[segmentedBar.selectedIndex]);
  }

  // pushing fatigue
  getPushingFatigueIndex() {
    return this.fatigues.indexOf(this.evaluation.get('PushingFatigue'));
  }

  onPushingFatigueIndexChange(args) {
    const segmentedBar = <SegmentedBar>args.object;
    this.evaluation.set('PushingFatigue', this.fatigues[segmentedBar.selectedIndex]);
  }

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
    if (app.ios) {
      this.isIOS = true;
    } else if (app.android) {
      this.isAndroid = true;
    }
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  get evaluation(): Evaluation {
    return EvaluationService.evaluation;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
