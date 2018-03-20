import { Component, OnInit } from '@angular/core';

import { CLog, LoggingService } from '@maxmobility/core';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  ngOnInit() {
    CLog('ProfileComponent OnInit');
  }
}
