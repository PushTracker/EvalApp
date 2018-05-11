// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// nativescript
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

  const Videos = [
    { Url: '<iframe style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/8fn26J59WJ4"></iframe>', 
      Description: 'This video is an overview of SmartDrive being used by people of varying ages and circumstances in a variety of environments.',
      Title: 'SmartDrive Introduction',
      Thumb: '~/assets/images/overview-thumb.jpg',
      Route:"/video"
    },
    { Url: '<iframe style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/uhA3-svjQFg"  ></iframe>', 
      Description: 'This video covers the basic operation and functionality of the SmartDrive MX2+ and PushTracker.',
      Title: 'SmartDrive MX2+ Basic Operation',
      Thumb: '~/assets/images/sd-basic-op-thumb.jpg',
      Route:"/video"
    },
    { Url: '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/6_M1J8HZXIk"  ></iframe>', 
      Description: 'PushTracker Basic Operation',
      Thumb: '~/assets/images/pt-basic-op-thumb.jpg',
      Route:"/video" 
    },
    { Url: '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/3B-6ked84us"  ></iframe>', 
      Description: 'Intro to the PushTracker App',
      Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
      Route:"/video" 
    },
    { Url: '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/3B-6ked84us"  ></iframe>', 
      Description: 'Intro to the Eval App',
      Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
      Route:"/video"  
    },
    { Url: '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/45Kj7zJpDcM"  ></iframe>', 
      Description: 'SmartDrive Evaluation and Training',
      Thumb: '~/assets/images/eval-thumb.jpg',
      Route:"/video"  
    },
    { Url: '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/hFid9ks551A"  ></iframe>', 
      Description: 'Interview with Chels and Steph',
      Thumb: '~/assets/images/interview-thumb.jpg',
      Route:"/video"  
    },
    
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

  public videos = Videos;

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

  didSelectItemAtIndex(args) {

    console.log(args.index);
  }

}