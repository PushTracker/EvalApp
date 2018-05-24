import { Component, Input, OnInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { CLog } from '@maxmobility/core';

@Component({
  selector: 'MyDrawerItem',
  moduleId: module.id,
  templateUrl: './my-drawer-item.component.html',
  styleUrls: ['./my-drawer-item.component.css']
})
export class MyDrawerItemComponent implements OnInit {
  @Input() title: string;
  @Input() description: string;
  @Input() route: string;
  @Input() icon: string;
  @Input() isSelected: boolean;

  constructor(private routerExtensions: RouterExtensions) {}

  ngOnInit(): void {
    CLog('MyDrawerItemComponent OnInit');
  }

  onNavItemTap(navItemRoute: string) {
    this.routerExtensions.navigate([navItemRoute], {
      // transition: {
      //   name: 'slide'
      // }
    });
  }
}
