import { Injectable } from '@angular/core';
import { Route, CanActivate, CanLoad } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { UserService } from '../services/user.service';

@Injectable()
export class AuthGuardService implements CanActivate, CanLoad {
  constructor(private _userService: UserService, private router: RouterExtensions) {}

  canActivate(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const user = await this._userService.user;
      console.log('canActivate user', user);
      if (user) {
        resolve(true);
      } else {
        console.log('user not authenticated, cannot pass authGuard');
        this.router.navigate(['/login'], {
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
