import { Injectable } from '@angular/core';
import { Route, CanActivate, CanLoad } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { TNSKinveyService } from '../services/tns-kinvey.service';

@Injectable()
export class AuthGuardService implements CanActivate, CanLoad {
  constructor(private _kinveyService: TNSKinveyService, private router: RouterExtensions) {}

  canActivate(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const user = await this._kinveyService.user;
      console.log('canActivate user', user);
      if (user) {
        resolve(true);
      } else {
        console.log('user not authenticated, cannot pass authGuard');
        this.router.navigate(['/signin'], {
          clearHistory: true
        });
        resolve(false);
      }
    });
  }

  canLoad(route: Route): Promise<boolean> {
    // reuse same logic to activate
    return this.canActivate();
  }
}
