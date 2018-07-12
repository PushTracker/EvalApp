// angular
import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from 'ui/scroll-view';
import { EventData } from 'data/observable';
import { StackLayout } from 'ui/layouts/stack-layout';
import { GridLayout } from 'ui/layouts/grid-layout';
import { Color } from 'tns-core-modules/color';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import { AnimationCurve } from 'ui/enums';
import { View } from 'ui/core/view';
import { Animation, AnimationDefinition } from 'ui/animation';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { Observable } from 'data/observable';

const orientation = require('nativescript-orientation');

@Component({
  selector: 'Video',
  moduleId: module.id,
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit, AfterViewInit {
  @ViewChild('description') description: ElementRef;

  url = String();
  title = String();
  desc = String();
  options = { rel: 1 };

  private routeSub: any; // subscription to route observer

  constructor(private _routerExtensions: RouterExtensions, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // see https://github.com/NativeScript/nativescript-angular/issues/1049
    this.routeSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        orientation.setOrientation('portrait');
        orientation.disableRotation();
      }
    });
    //orientation.setOrientation('portrait');
    orientation.enableRotation();

    const query = this.route.snapshot.queryParams;

    this.url = `${query['url']}`;
    this.title = `${query['title']}`;
    this.desc = `${query['desc']}`;
  }

  ngAfterViewInit() {
    // const title = <View>this.title.nativeElement as Label;
    // const pt = <View>this.ptImage.nativeElement as Image;
    // setTimeout(() => {
    //     pt.animate({
    // 	duration: 1000,
    // 	curve: AnimationCurve.easeInOut,
    // 	opacity: 1
    //     });
    // }, 500)
    // setTimeout(() => {
    //         title.animate({
    // 	duration: 1000,
    // 	curve: AnimationCurve.easeInOut,
    // 	opacity: 1
    //     });
    // }, 500)
    // setTimeout(() => {
    //         description.animate({
    // 	duration: 1000,
    // 	curve: AnimationCurve.easeInOut,
    // 	opacity: 1
    //     });
    // }, 750)
  }
}
