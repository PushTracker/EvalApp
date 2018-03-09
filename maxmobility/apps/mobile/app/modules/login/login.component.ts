import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { RouterExtensions } from 'nativescript-angular/router';
import { isAndroid, isIOS, device, screen } from 'tns-core-modules/platform';
import { Page } from 'tns-core-modules/ui/page';
import { Color } from 'tns-core-modules/color';
import { Image } from 'tns-core-modules/ui/image';
import { View } from 'tns-core-modules/ui/core/view';
import { Animation, AnimationDefinition } from 'tns-core-modules/ui/animation';
import { TextField } from 'tns-core-modules/ui/text-field';
// app
import { User } from '../../shared/user';
import { LoginService } from '../../shared/login.service';

@Component({
  selector: 'Login',
  moduleId: module.id,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('container') container: ElementRef;
  @ViewChild('icon') icon: ElementRef;
  @ViewChild('email') email: ElementRef;
  @ViewChild('password') password: ElementRef;

  // public members
  user: User;
  isLoggingIn: boolean = true;

  // private members

  // functions
  constructor(
    private routerExtensions: RouterExtensions,
    private loginService: LoginService,
    private page: Page,
    private location: Location
  ) {
    this.user = new User();
  }

  /************************************************************
   * Use the sideDrawerTransition property to change the open/close animation of the drawer.
   *************************************************************/
  ngOnInit(): void {
    this.page.actionBarHidden = true;
    this.page.backgroundSpanUnderStatusBar = true;
    this.page.backgroundColor = '#0067A6';
    this.page.addCss('Page { background-repeat: no-repeat; background-size: 100% 100%; }');
  }

  enterApp(): void {
    this.routerExtensions.navigate(['/home'], {
      transition: {
        name: 'fade'
      },
      clearHistory: true
    });
  }

  cancel(): void {
    this.enterApp();
  }

  submit(): void {
    if (!this.user.isValidEmail()) {
      alert(`"${this.user.email}" is not a valid email address!`);

      return;
    }
    if (this.isLoggingIn) {
      this.login();
    } else {
      this.signUp();
    }
  }

  login(): void {
    this.loginService
      .login(this.user)
      .subscribe(
        () => this.enterApp(),
        error => this.handleErrors(error, 'Login Failed', "Unfortunately we couldn't find your account")
      );
  }

  signUp(): void {
    this.loginService.register(this.user).subscribe(
      () => {
        this.toggleDisplay();
      },
      error => this.handleErrors(error, 'Register Failed', "Unfortunately we couldn't create your account")
    );
  }

  navToSignUp() {
    this.routerExtensions.navigate(['/sign-up']);
  }

  toggleDisplay(): void {
    this.isLoggingIn = !this.isLoggingIn;
    /*
	this.setTextFieldColors();
	// animate the background of the container
	let container = <View>this.container.nativeElement;
	container.animate({
	    backgroundColor: this.isLoggingIn ? new Color("white") : new Color("#301217"),
	    duration: 200
	});
	// animate the rotation of the icon
	let icon = <View>this.icon.nativeElement;
	let definitions = new Array<AnimationDefinition>();
	definitions.push({target: icon, rotate: 360, scale: {x:1.1, y:1.1}, duration: 200 });
	definitions.push({target: icon, rotate: 0, scale: {x:1, y:1}, duration: 200 });
	var playSequentially = true;
	var animationSet = new Animation(definitions, playSequentially);
	animationSet.play().then(() => {
            //console.log("Animation finished");
	})
	    .catch((e) => {
		console.log(e.message);
	    });
	*/
  }

  setTextFieldColors(): void {
    const emailTextField = <TextField>this.email.nativeElement;
    const passwordTextField = <TextField>this.password.nativeElement;

    const mainTextColor = new Color(this.isLoggingIn ? 'black' : '#C4AFB4');
    emailTextField.color = mainTextColor;
    passwordTextField.color = mainTextColor;

    const hintColor = new Color(this.isLoggingIn ? '#AcA6A7' : '#C4AFB4');
    // setHintColor({ view: emailTextField, color: hintColor });
    // setHintColor({ view: passwordTextField, color: hintColor });
  }

  private handleErrors(error, message, defaultText): void {
    const errors = error.json && error.json().errors;
    if (errors && errors.length) {
      alert(`${message}:\n${errors.join('\n')}`);
    } else if (errors && errors.full_messages) {
      alert(`${message}:\n${errors.full_messages}`);
    } else {
      alert(defaultText);
    }
  }
}
