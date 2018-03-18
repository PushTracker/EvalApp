import { Injectable, NgZone } from '@angular/core';

@Injectable()
export class TestService {
  constructor(private _ngZone: NgZone) {}
}
