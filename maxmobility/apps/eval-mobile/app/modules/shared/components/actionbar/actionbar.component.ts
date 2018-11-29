import { Component, Input } from '@angular/core';

import { ActionBar, ActionItem } from 'ui/action-bar';

@Component({
  selector: 'MaxActionBar',
  moduleId: module.id,
  templateUrl: './actionbar.component.html',
  styleUrls: ['./actionbar.component.css']
})
export class ActionbarComponent extends ActionBar {
  @Input() title: string;
  @Input() allowNav: boolean = true;

  onPTConnTap(): void {
    console.log('success!');
  }
}
