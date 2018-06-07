// angular
import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  constructor(private _routerExtensions: RouterExtensions, private route: ActivatedRoute) {}

  ngOnInit() {
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

  onDrawerButtonTap(): void {}
}
