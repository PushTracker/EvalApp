// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
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

import { Pairing } from './shared/pairing.model';
import { PairingService } from './shared/pairing.service';

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css'],
  providers: [PairingService]
})
export class PairingComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  pairing: Pairing[] = [];

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private pairingService: PairingService, private _routerExtensions: RouterExtensions) {}

  ngOnInit() {
    this.pairingService.getList().subscribe(res => {
      this.pairing = res;
    });

    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
