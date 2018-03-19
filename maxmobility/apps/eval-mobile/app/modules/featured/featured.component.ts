// angular
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { Color } from 'tns-core-modules/color';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

@Component({
  selector: 'Featured',
  moduleId: module.id,
  templateUrl: './featured.component.html',
  styleUrls: ['./ota.component.css']
})
export class FeaturedComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  sdBtProgressValue: number;
  sdMpProgressValue: number;
  ptBtProgressValue: number;

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
}
