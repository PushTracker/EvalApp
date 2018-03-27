import { Component, Input, OnInit } from '@angular/core';
import { CLog, UserService } from '@maxmobility/mobile';
import { User } from '@maxmobility/core';

@Component({
  selector: 'MyDrawer',
  moduleId: module.id,
  templateUrl: './my-drawer.component.html',
  styleUrls: ['./my-drawer.component.css']
})
export class MyDrawerComponent implements OnInit {
  @Input() selectedPage: string;

  user = this._userService.user;

  constructor(private _userService: UserService) {}

  ngOnInit() {
    CLog('MyDrawer.Component OnInit');
  }

  isPageSelected(pageTitle: string) {
    return pageTitle === this.selectedPage;
  }
}
