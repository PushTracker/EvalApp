// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from "ui/scroll-view"; 
import { Color } from 'tns-core-modules/color';
import { AnimationCurve } from "ui/enums";
import { View } from "ui/core/view";
import { Animation, AnimationDefinition } from "ui/animation";
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { Observable, Scheduler } from "rxjs";

// const timeElapsed = Observable.defer(() => {
//     const start = Scheduler.animationFrame.now();
//     return Observable.interval(1)
//         .map(() => Math.floor((Date.now() - start)));
// });

// const duration = (totalMs) =>
//     timeElapsed
//         .map(elapsedMs => elapsedMs / totalMs)
//         .takeWhile(t => t <= 1);

// const amount = (d) => (t) => t * d;

// const elasticOut = (t) =>
//     Math.sin(-13.0 * (t + 1.0) *
//         Math.PI / 2) *
//     Math.pow(2.0, -10.0 * t) +
//     1.0;

@Component({
  selector: 'Featured',
  moduleId: module.id,
  templateUrl: './featured.component.html',
  styleUrls: ['./featured.component.css']
})
export class FeaturedComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  @ViewChild('scrollView') scrollView: ElementRef;
  @ViewChild("sdConnectionButton") sdConnectionButton: ElementRef;
  @ViewChild("ptConnectionButton") ptConnectionButton: ElementRef;
  @ViewChild("otaTitleView") otaTitleView: ElementRef;
  @ViewChild("otaProgressViewSD") otaProgressViewSD: ElementRef;
  @ViewChild("otaProgressViewPT") otaProgressViewPT: ElementRef;
  @ViewChild("otaFeaturesView") otaFeaturesView: ElementRef;

  // blah$: Observable<number> = Observable.of(25);

  titleText = "Press the right button on your PushTracker to connect. (use the one up to the left to test)";
  otaButtonText = "Begin Firmware Updates";

  sdBtConnected = false;
  ptBtConnected = false;

  ptConnectionButtonClass = "fa grayed";
  sdConnectionButtonClass = "fa grayed";

  bTSmartDriveConnectionIcon = String.fromCharCode(0xf293);
  bTPushTrackerConnectionIcon = String.fromCharCode(0xf293);

  sdBtProgressValue = 0;
  sdMpProgressValue = 0;
  ptBtProgressValue = 0;

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {

    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.opacity = 0;

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.opacity = 0;

    const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
    otaProgressViewPT.opacity = 0;

    const otaFeaturesView = <View>this.otaFeaturesView.nativeElement;
    otaFeaturesView.opacity = 0;

    this._sideDrawerTransition = new SlideInOnTopTransition();

  }

  onValueChanged(args) {
    const progressBar = <Progress>args.object;

    console.log('Value changed for ' + progressBar);
    console.log('New value: ' + progressBar.value);
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }
  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

   // Connectivity
  didConnectPushTracker(connected) {

    this.bTPushTrackerConnectionIcon = connected = true ? String.fromCharCode(0xf294) : String.fromCharCode(0xf293);

    this.ptConnectionButtonClass = connected = true ? "fa hero" : "fa grayed";

    // tslint:disable-next-line:max-line-length
    this.titleText = connected = true ? "Firmware Version 1.5" : "Press the right button on your PushTracker to connect. (use the one here to test)";

    // tslint:disable-next-line:max-line-length
    this.otaButtonText = connected = true ? "Begin Firmware Updates" : "Press the right button on your PushTracker to connect. (use the one here to test)";

    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.animate({
      opacity: 1,
      duration: 500
    });

    // this.blah$ = duration(800)
    // .map(elasticOut)
    // .map(amount(150));

  }
  didConnectPSmartDrive(connected) {

    this.bTSmartDriveConnectionIcon = connected = true ? String.fromCharCode(0xf294) : String.fromCharCode(0xf293);

    this.sdConnectionButtonClass = connected = true ? "fa hero" : "fa grayed";

  }

  didDisoverSmartDrives() {

    // show list of SDs

  }

  onPtButtonTapped() {
    this.didConnectPushTracker(true);
  }

  onSdButtonTapped() {
    this.didConnectPSmartDrive(true);
  }

  onStartOtaUpdate() {

    this.otaButtonText = "updating SmartDrive firmware...";

    const scrollView = this.scrollView.nativeElement as ScrollView;

    // const scrollView = new ScrollView();

    const offset = scrollView.scrollableHeight;
    console.log(offset);

    scrollView.scrollToVerticalOffset(offset, true);

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.animate({
      opacity: 1,
      duration: 500
    });

    const otaFeaturesView = <View>this.otaFeaturesView.nativeElement;
    otaFeaturesView.animate({
      opacity: 1,
      duration: 500
    });

    setInterval(() => {

      this.sdBtProgressValue += 5;
      if (this.sdBtProgressValue > 100) {
      this.sdBtProgressValue = 100;
      const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
      otaProgressViewPT.animate({
        opacity: 1,
        duration: 500
      });
      this.otaButtonText = "updating PushTracker";
      this.ptBtProgressValue += 10;
      if (this.ptBtProgressValue > 100) {
        this.ptBtProgressValue = 100;
        this.otaButtonText = "Update Complete";
      }
    }

      this.sdMpProgressValue += 10;
      if (this.sdMpProgressValue > 100) {
        this.sdMpProgressValue = 100;
      }
    }, 1000);
  }

}
