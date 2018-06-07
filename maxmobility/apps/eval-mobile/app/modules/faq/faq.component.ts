import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { isAndroid, isIOS } from 'platform';

const FAQs = [
  {
    question: "Why isn't my SmartDrive engaging?",
    answer:
      'Generally, you should check these things: 1) that your SmartDrive is powered on, 2) that your PushTracker is in "SD On" mode - the blue light should be flashing, and 3) that you are in MX2+ mode - in which a double tap will engage the motor.'
  },
  {
    question: 'Can my SmartDrive slow me down?',
    answer:
      'Unfortunately, no - the SmartDrive is incapable of prividing any braking for your chair. This means that after you turn off the motor you will need to manually grab the handrims and bring your chair to a stop.  This also means that your SmartDrive cannot slow you down going down a ramp or a hill.'
  },
  {
    question: 'Do I need to re-pair my PushTracker to my SmartDrive?',
    answer:
      'No, the only time you need to re-pair your PushTracker to your SmartDrive is after performing an over-the-air (OTA) update. After doing that, the PushTracker will automatically go into pairing mode when you try to connect or turn "SD On".'
  },
  {
    question: "Why won't my PushTracker connect to my phone?",
    answer:
      "If you are using Android then it might be because the phone has saved the pairing information - which will prevent the PushTracker from establishing a solid connection.  To fix this, simply open your phone's bluetooth settings menu and click 'Forget' on the PushTracker that shows up in that menu.  Once you have done that, restart the app and the PushTracker should be able to reliably connect - without needing to re-pair to the phone!"
  },
  {
    question: 'How can I make the SmartDrive safe for children?',
    answer:
      'The SmartDrive is safe for children to use - but we do recommend the best way to ensure safety is to train them on proper tapping and braking techniques. Moreover, we have included the ability to limit the max speed of the SmartDrive (from 0.5 miles per hour all the way up to 5.5 miles per hour) as well as the acceleration of the SmartDrive. For someone who is just learning to push or to use a SmartDrive, we recommend setting both very low.'
  },
  {
    question: 'Why should I want a SmartDrive / I need to push or I will lose my independence!',
    answer:
      "You should be active and go out into the world! With pushing however, unlike the general advice with walking (where people really cannot walk too much) - people can push too much! If you push too much then you will be more likely to get pain and injury in your arms and shoulders - which may limit your mobility and independence.  With the SmartDrive you are still able to push around in your chair as you normally would - you can now go farther faster and with less effort! Use it when you need to get somewhere fast or up a big hill - don't kill your shoulders if you don't have to! Enjoy your journey with your SmartDrive!"
  }
];
export { FAQs };

@Component({
  selector: 'FAQ',
  moduleId: module.id,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FAQComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  public faqs = FAQs;

  private _sideDrawerTransition: DrawerTransitionBase;

  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
