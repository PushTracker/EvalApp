// angular
import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
import { Observable, EventData } from 'tns-core-modules/data/observable';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { GridLayout } from 'tns-core-modules/ui/layouts/grid-layout';
import { Color } from 'tns-core-modules/color';
import { Image } from 'tns-core-modules/ui/image';
import { Label } from 'tns-core-modules/ui/label';
import { AnimationCurve } from 'tns-core-modules/ui/enums';
import { View } from 'tns-core-modules/ui/core/view';
import { Animation, AnimationDefinition } from 'tns-core-modules/ui/animation';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
// import { Observable, Scheduler } from "rxjs";

// libs
import { CLog } from '@maxmobility/mobile';
import { BluetoothService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css']
})
export class PairingComponent implements OnInit, AfterViewInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  @ViewChild('ptImage') ptImage: ElementRef;
  @ViewChild('sdImage') sdImage: ElementRef;
  @ViewChild('title') title: ElementRef;
  @ViewChild('description') description: ElementRef;

  show = false;

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private _routerExtensions: RouterExtensions, private _bluetoothService: BluetoothService) {}

  ngOnInit() {
    this._sideDrawerTransition = new SlideInOnTopTransition();

    const title = <View>this.title.nativeElement;
    const description = <View>this.description.nativeElement;
    const pt = (<View>this.ptImage.nativeElement) as Image;

    title.opacity = 0;
    description.opacity = 0;

    // TODO: cases we need to handle:
    //  - a new pushtracker we haven't seen pairs
    //  - a previously paired / connected pushtracker re-pairs

    // handle pushtracker pairing events for existing pushtrackers
    console.log('registering for pairing events!');
    BluetoothService.PushTrackers.map(pt => {
      console.log(pt);
      pt.on(PushTracker.pushtracker_paired_event, args => {
        console.log(`PT PAIRED EVENT!`);
        this.onConnectTap(null);
      });
    });
    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        console.log(`PT ADDED EVENT!`);
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        if (pt) {
          pt.on(PushTracker.pushtracker_paired_event, args => {
            console.log(`PT PAIRED EVENT!`);
            this.onConnectTap(null);
          });
        }
      }
    });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    CLog('ngAfterViewInit');

    const title = (<View>this.title.nativeElement) as Label;
    const description = (<View>this.description.nativeElement) as Label;
    const pt = (<View>this.ptImage.nativeElement) as Image;

    title.opacity = 0;
    title.text = 'PushTracker';
    description.opacity = 0;
    description.text = 'Press the right buton on the PushTracker to initiate pairing';

    setTimeout(() => {
      pt.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 1
      });
    }, 500);

    setTimeout(() => {
      title.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 1
      });
    }, 500);

    setTimeout(() => {
      description.animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 1
      });
    }, 750);
  }

  pageLoaded(args: EventData) {
    let page = <GridLayout>args.object;

    console.log('pageLoaded');
    CLog('pageLoaded');
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  onConnectTap(args: EventData) {
    const title = (<View>this.title.nativeElement) as Label;
    const description = (<View>this.description.nativeElement) as Label;
    const pt = (<View>this.ptImage.nativeElement) as Image;
    const sd = (<View>this.sdImage.nativeElement) as Image;
    pt
      .animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 0
      })
      .then(() => {
        setTimeout(() => {
          sd.animate({
            duration: 1000,
            curve: AnimationCurve.easeInOut,
            opacity: 1
          });
        }, 500);
      });

    title
      .animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 0
      })
      .then(() => {
        setTimeout(() => {
          title.text = 'SmartDrive';
          title.animate({
            duration: 1000,
            curve: AnimationCurve.easeInOut,
            opacity: 1
          });
        }, 500);
      });

    description
      .animate({
        duration: 1000,
        curve: AnimationCurve.easeInOut,
        opacity: 0
      })
      .then(() => {
        setTimeout(() => {
          description.text = 'Press and hold the left button to enter settings.';
          description.animate({
            duration: 1000,
            curve: AnimationCurve.easeInOut,
            opacity: 1
          });
        }, 500);
      });
  }
}
