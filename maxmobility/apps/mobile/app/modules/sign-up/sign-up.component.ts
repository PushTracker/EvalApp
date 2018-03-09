import { Component, OnInit } from '@angular/core';

// libs
import { RouterExtensions } from 'nativescript-angular/router';
import { Store, select } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '@maxmobility/mobile';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { User } from '@maxmobility/core';

@Component({
  selector: 'eval-login',
  moduleId: module.id,
  templateUrl: './sign-up.component.html'
})
export class SignUpComponent implements OnInit {
  user: User;
  constructor(private _userService: UserService, private _router: RouterExtensions) {}

  ngOnInit() {
    console.log('SignUpComponent OnInit');
  }

  signUpTap() {
    try {
      this._userService.register(this.user).then(data => {
        console.log(data);
      });
    } catch (error) {
      console.log(error);
    }
  }

  navToLogin() {
    this._router.navigate(['/account']);
  }
}
