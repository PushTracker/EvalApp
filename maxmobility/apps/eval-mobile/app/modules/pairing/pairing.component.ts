// angular
import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from "ui/scroll-view";
import { EventData } from 'data/observable';
import { StackLayout } from 'ui/layouts/stack-layout';
import { GridLayout } from 'ui/layouts/grid-layout';
import { Color } from 'tns-core-modules/color';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import { AnimationCurve } from "ui/enums";
import { View } from "ui/core/view";
import { Animation, AnimationDefinition } from "ui/animation";
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
// import { Observable, Scheduler } from "rxjs";
import { Observable } from "data/observable";

import { CLog } from '@maxmobility/mobile';

import { Pairing } from './shared/pairing.model';
import { PairingService } from './shared/pairing.service';

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css'],
  providers: [PairingService]
})
export class PairingComponent implements OnInit, AfterViewInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  @ViewChild("ptImage") ptImage: ElementRef;
  @ViewChild("sdImage") sdImage: ElementRef;
  @ViewChild("title") title: ElementRef;
  @ViewChild("description") description: ElementRef;

  show = false;

  pairing: Pairing[] = [];

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private pairingService: PairingService, private _routerExtensions: RouterExtensions) {}

  ngOnInit() {
    this.pairingService.getList().subscribe(res => {
      this.pairing = res;
    });

    this._sideDrawerTransition = new SlideInOnTopTransition();

    const title = <View>this.title.nativeElement;
    const description = <View>this.description.nativeElement;
    const pt = <View>this.ptImage.nativeElement as Image;

    title.opacity = 0;
    description.opacity = 0

  }

  ngAfterViewInit() {

    console.log("ngAfterViewInit");
    CLog("ngAfterViewInit");

    const title = <View>this.title.nativeElement as Label;
    const description = <View>this.description.nativeElement as Label;
    const pt = <View>this.ptImage.nativeElement as Image;

    title.opacity = 0;
    title.text = "PushTracker"
    description.opacity = 0
    description.text = "Press the right buton on the PushTracker to initiate pairing"

    setTimeout(() => {
      pt.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 1
    });
    }, 500)

    setTimeout(() => {
        title.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 1
    });
    }, 500)

    setTimeout(() => {
           description.animate({
           duration: 1000,
           curve: AnimationCurve.easeInOut,
           opacity: 1
    });
    }, 750)
       

    
  }

  

pageLoaded(args: EventData) {
    let page = <GridLayout>args.object;

    console.log("pageLoaded");
    CLog("pageLoaded");
}

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  onConnectTap(args: EventData) {
    const title = <View>this.title.nativeElement as Label;
    const description = <View>this.description.nativeElement as Label;
    const pt = <View>this.ptImage.nativeElement as Image;
    const sd = <View>this.sdImage.nativeElement as Image;
    pt.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 0
    }).then(() => {
        setTimeout(() => {
            sd.animate({
               duration: 1000,
               curve: AnimationCurve.easeInOut,
               opacity: 1
    })
        }, 500)
    })

    title.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 0
    }).then(() => {
        setTimeout(() => {
          title.text = "SmartDrive"
            title.animate({
               duration: 1000,
               curve: AnimationCurve.easeInOut,
               opacity: 1
    })
        }, 500)
    })

    description.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 0
    }).then(() => {
        setTimeout(() => {
           description.text = "Press and hold the left button to enter settings."
            description.animate({
               duration: 1000,
               curve: AnimationCurve.easeInOut,
               opacity: 1
    })
        }, 500)
    })
}


}
