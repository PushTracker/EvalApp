// angular
import { Component, OnInit, ViewChild } from '@angular/core';
// nativescript
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

import {registerElement} from "nativescript-angular/element-registry";
registerElement("exoplayer", () => require("nativescript-exoplayer").Video);

@Component({
  selector: 'Videos',
  moduleId: module.id,
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent implements OnInit {
  videos = [
    { Url: 'https://drive.google.com/drive/folders/0B3EsLOeFJxiGX3p2MjloTGNyVFk', Description: 'SmartDrive MX2+ Basic Operation' },
    { Url: 'https://drive.google.com/drive/folders/0B3EsLOeFJxiGX3p2MjloTGNyVFk', Description: 'PushTracker Basic Operation' },
    { Url: 'https://drive.google.com/drive/folders/0B3EsLOeFJxiGX3p2MjloTGNyVFk', Description: 'Intro to the PushTracker App' },
    { Url: 'https://drive.google.com/drive/folders/0B3EsLOeFJxiGX3p2MjloTGNyVFk', Description: 'Intro to the Eval App App' },
    { Url: 'https://drive.google.com/drive/folders/0B3EsLOeFJxiGX3p2MjloTGNyVFk', Description: 'How to perform a Smart Drive Eval' },
  ];

  // tslint:disable-next-line:max-line-length
  videoHtmlString = '<iframe height="75" width="125" src="https://www.youtube.com/embed/6_M1J8HZXIk" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  private _sideDrawerTransition: DrawerTransitionBase;

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  onItemTapThirdList(args) {
    console.log(args.index);
  }
}
