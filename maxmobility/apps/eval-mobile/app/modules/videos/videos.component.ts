// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// nativescript
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

// import {registerElement} from "nativescript-angular/element-registry";
// registerElement("exoplayer", () => require("nativescript-exoplayer").Video);

@Component({
  selector: 'Videos',
  moduleId: module.id,
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent implements OnInit {


  videoHtmlString_0 = '<iframe height="75" width="135" src="https://www.youtube.com/embed/8fn26J59WJ4" modestbranding=1 controlles=0 frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_1 = '<iframe height="75" width="135" src="https://www.youtube.com/embed/uhA3-svjQFg" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_2 = '<iframe height="75" width="135" src="https://www.youtube.com/embed/6_M1J8HZXIk" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_3 = '<iframe height="75" width="135" src="https://www.youtube.com/embed/3B-6ked84us" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_4 = '<iframe height="75" width="135" src="https://www.youtube.com/embed/3B-6ked84us" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_5 = '<iframe height="75" width="135" src="https://www.youtube.com/embed/45Kj7zJpDcM" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_6 = '<iframe height="75" width="135" src="https://www.youtube.com/embed/hFid9ks551A" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

    videos = [
    { Url: this.videoHtmlString_0, Description: 'SmartDrive Introduction' 
    },
    { Url: this.videoHtmlString_1, Description: 'SmartDrive MX2+ Basic Operation' },
    { Url: this.videoHtmlString_2, Description: 'PushTracker Basic Operation' 
    },
    { Url: this.videoHtmlString_3, Description: 'Intro to the PushTracker App' 
    },
    { Url: this.videoHtmlString_4, Description: 'Intro to the Eval App' 
    },
    { Url: this.videoHtmlString_5, Description: 'SmartDrive Evaluation and Training' 
    },
    { Url: this.videoHtmlString_6, Description: 'Interview with Chels and Steph' 
    },
    
  ];          

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

  didSelectItemAtIndex(args) {

    console.log(args.index);
  }

