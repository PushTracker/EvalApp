import { Component, Input, OnInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { CLog } from '@maxmobility/core';
import { isAndroid, isIOS } from "platform";

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

    isIOS(): boolean {
        return isIOS;
    }

    isAndroid(): boolean {
        return isAndroid;
    }

  onNavItemTap(navItemRoute: string) {
    if (this.isIOS){
      this.routerExtensions.navigate([navItemRoute], {});
    } else{
      this.routerExtensions.navigate([navItemRoute], {
      transition: {
        name: 'slide'
      }
    });
    }
  }

  
}
