import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as Connectivity from 'tns-core-modules/connectivity';

@Injectable()
export class NetworkService implements OnInit {
  public networkSubject: BehaviorSubject<number>;

  constructor() {
    const x = Connectivity.getConnectionType();
    this.networkSubject = new BehaviorSubject<number>(x);
  }

  ngOnInit() {
    // setTimeout(() => {
    Connectivity.startMonitoring(connectionType => {
      console.log('network type', connectionType);
      this.networkSubject.next(connectionType);
    });
    // }, 2000);
  }

  private connectionToString(connectionType: number): string {
    switch (connectionType) {
      case Connectivity.connectionType.none:
        return 'No Connection!';
      case Connectivity.connectionType.wifi:
        return 'Connected to WiFi!';
      case Connectivity.connectionType.mobile:
        return 'Connected to Cellular!';
      default:
        return 'Unknown';
    }
  }
}
