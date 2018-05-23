import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { CLog } from '@maxmobility/core';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

const Videos = [
  {
    Url: `<iframe style="margin-bottom: 10; padding:0; border:0;
    width:100%; height:100%" src="https://www.youtube.com/embed/8fn26J59WJ4"></iframe>`,
    Description: `This video is an overview of SmartDrive being used by
    people of varying ages and circumstances in a variety of environments.`,
    Title: 'SmartDrive Introduction',
    Thumb: '~/assets/images/overview-thumb.jpg',
    Route: '/video'
  },
  {
    Url: `<iframe style="margin-bottom: 10; padding:0; border:0;
      width:100%; height:100%" src="https://www.youtube.com/embed/uhA3-svjQFg"></iframe>`,
    Description: 'This video covers the basic operation and functionality of the SmartDrive MX2+ and PushTracker.',
    Title: 'SmartDrive MX2+ Basic Operation',
    Thumb: '~/assets/images/sd-basic-op-thumb.jpg',
    Route: '/video'
  },
  {
    Url: `<iframe  style="margin-bottom: 10; padding:0; border:0;
      width:100%; height:100%" src="https://www.youtube.com/embed/6_M1J8HZXIk"></iframe>`,
    Description: 'This video covers the basic operation and functionality of the PushTracker.',
    Title: 'PushTracker Basic Operation',
    Thumb: '~/assets/images/pt-basic-op-thumb.jpg',
    Route: '/video'
  },
  {
    Url: `<iframe  style="margin-bottom: 10; padding:0; border:0;
      width:100%; height:100%" src="https://www.youtube.com/embed/3B-6ked84us"></iframe>`,
    Description: 'This video covers the basic operation and functionality of the PushTracker App.',
    Title: 'Intro to the PushTracker App',
    Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
    Route: '/video'
  },
  {
    Url: `<iframe  style="margin-bottom: 10; padding:0; border:0;
      width:100%; height:100%" src="https://www.youtube.com/embed/3B-6ked84us"></iframe>`,
    Description: 'This video covers the basic operation and functionality of the Smart Evaluation App.',
    Title: 'Intro to the Eval App',
    Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
    Route: '/video'
  },
  {
    Url: `<iframe  style="margin-bottom: 10; padding:0; border:0;
      width:100%; height:100%" src="https://www.youtube.com/embed/45Kj7zJpDcM"></iframe>`,
    Description: 'This video covers the steps to perform when doing a SmartDrive Evaluation or Training',
    Title: 'SmartDrive Evaluation and Training',
    Thumb: '~/assets/images/eval-thumb.jpg',
    Route: '/video'
  },
  {
    Url: `<iframe  style="margin-bottom: 10; padding:0; border:0;
      width:100%; height:100%" src="https://www.youtube.com/embed/hFid9ks551A"></iframe>`,
    Description: `In this video, I interview Chels and Steph about the many aspects of
      their lives, and how they have been impacted by SmartDrive`,
    Title: 'Interview with Chels and Steph',
    Thumb: '~/assets/images/interview-thumb.jpg',
    Route: '/video'
  }
];

export { Videos };

@Component({
  selector: 'Videos',
  moduleId: module.id,
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  videos = Videos;

  private _sideDrawerTransition: DrawerTransitionBase;
  constructor(private _routerExtensions: RouterExtensions) {}

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  onItemTap(args) {
    const item = this.videos[args.index];
    const url = item.Url;
    const route = item.Route;
    const title = item.Title;
    const desc = item.Description;

    this._routerExtensions.navigate([route], {
      transition: {
        name: ''
      },
      queryParams: {
        url,
        desc,
        title
      }
    });
  }

  onNavBtnTap(): void {
    this._routerExtensions.navigate(['/home'], {
      clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }
}
