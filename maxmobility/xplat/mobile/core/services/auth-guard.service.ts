import { Injectable } from '@angular/core';
import { Route, CanActivate, CanLoad } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { UserService } from '../services/user.service';
import { CLog, LoggingService } from '@maxmobility/core';

@Injectable()
export class AuthGuardService implements CanActivate, CanLoad {
  constructor(private _userService: UserService, private router: RouterExtensions) {}

  canActivate(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const user = await this._userService.user;
      CLog('canActivate user', JSON.stringify(user));
      if (user) {
        resolve(true);
      } else {
        CLog(`${String.fromCodePoint(0x1f44b)} User not authenticated, cannot pass authGuard`);
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
