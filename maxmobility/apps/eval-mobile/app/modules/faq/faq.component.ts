import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

@Component({
  selector: 'FAQ',
  moduleId: module.id,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FAQComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  faqs = [
    {
      question: 'What is a SmartDrive?',
      answer: 'Why you no know?! >:['
    },
    {
      question: "What's a Goku?",
      answer: 'Kamehameha'
    },
    {
      question: 'How far away is Yoda?',
      answer: 'Not far, yoda not far.'
    },
    {
      question: 'Will it take me long to get there?',
      answer: 'Patience, soon you will be with him.'
    },
    {
      question: 'The Wheel of Time turns...',
      answer:
        '...and ages come and pass - leaving memories that fade to legend. Legend fades to myth and even myth is long forgotten when the age that gave it birth comes round again.  In one age - called the third age by some - an age yet to come, an age long past, a wind arose in the mountains of mist.'
    }
  ];

  private _sideDrawerTransition: DrawerTransitionBase;

  /************************************************************
   * Use the sideDrawerTransition property to change the open/close animation of the drawer.
   *************************************************************/
  ngOnInit(): void {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  /************************************************************
   * According to guidelines, if you have a drawer on your page, you should always
   * have a button that opens it. Use the showDrawer() function to open the app drawer section.
   *************************************************************/
  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
