// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { Color } from 'tns-core-modules/color';
import { AnimationCurve } from "ui/enums";
import { View } from "ui/core/view";
import { Animation, AnimationDefinition } from "ui/animation";
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

@Component({
  selector: 'Featured',
  moduleId: module.id,
  templateUrl: './featured.component.html',
  styleUrls: ['./featured.component.css']
})
export class FeaturedComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  @ViewChild("sdConnectionButton") sdConnectionButton: ElementRef;
  @ViewChild("ptConnectionButton") ptConnectionButton: ElementRef;
  @ViewChild("otaTitleView") otaTitleView: ElementRef;
  @ViewChild("otaProgressViewSD") otaProgressViewSD: ElementRef;
  @ViewChild("otaProgressViewPT") otaProgressViewPT: ElementRef;
  @ViewChild("otaFeaturesView") otaFeaturesView: ElementRef;

  sdBtConnected = false;
  ptBtConnected = false;

  ptConnectionButtonClass = "fa grayed";
  sdConnectionButtonClass = "fa grayed";

  bTSmartDriveConnectionIcon = String.fromCharCode(0xf293);
  bTPushTrackerConnectionIcon = String.fromCharCode(0xf293);

  sdBtProgressValue: number;
  sdMpProgressValue: number;
  ptBtProgressValue: number;

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

    this.sdBtProgressValue = 0;
    this.sdMpProgressValue = 0;
    this.ptBtProgressValue = 0;

    setInterval(() => {
      this.sdBtProgressValue += 1;
      if (this.sdBtProgressValue > 100) {
        this.sdBtProgressValue = 100;
      }

      this.sdMpProgressValue += 5;
      if (this.sdMpProgressValue > 100) {
        this.sdMpProgressValue = 100;
      }

      this.ptBtProgressValue += 10;
      if (this.ptBtProgressValue > 100) {
        this.ptBtProgressValue = 100;
      }

      // this.onValueChanged(5);
    }, 2300);
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

    this.ptConnectionButtonClass = connected = true ? "fa permobil-primary-btn" : "fa grayed";

    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.animate({
      opacity: 1,
      duration: 800
    });

  }
  didConnectPSmartDrive(connected) {

    this.bTSmartDriveConnectionIcon = connected = true ? String.fromCharCode(0xf294) : String.fromCharCode(0xf293);

    this.sdConnectionButtonClass = connected = true ? "fa permobil-primary-btn" : "fa grayed";

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

}
