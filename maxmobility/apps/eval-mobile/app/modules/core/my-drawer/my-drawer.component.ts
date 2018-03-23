import { Component, Input, OnInit } from '@angular/core';
import { CLog } from '@maxmobility/mobile';

/************************************************************
 * Keep data that is displayed in your app drawer in the MyDrawer component class.
 * Add new data objects that you want to display in the drawer here in the form of properties.
 *************************************************************/
@Component({
  selector: 'MyDrawer',
  moduleId: module.id,
  templateUrl: './my-drawer.component.html',
  styleUrls: ['./my-drawer.component.css']
})
export class MyDrawerComponent implements OnInit {
  @Input() selectedPage: string;

  ngOnInit() {
    CLog('MyDrawer.Component OnInit');
  }

  isPageSelected(pageTitle: string) {
    return pageTitle === this.selectedPage;
  }
}
