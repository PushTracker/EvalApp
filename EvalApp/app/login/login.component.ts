import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { isAndroid, isIOS, device, screen } from "platform";
import { RouterExtensions } from "nativescript-angular/router";
import { Page } from "ui/page";
import { Color } from "color";
import { Image } from "ui/image";
import { View } from "ui/core/view";
import { Animation, AnimationDefinition } from "ui/animation";

//import { setHintColor } from "../../utils/hint-util";
import { TextField } from "ui/text-field";

import { User } from "../shared/user";
import { LoginService } from "../shared/login.service";

import { Location } from "@angular/common";

@Component({
    selector: "Login",
    moduleId: module.id,
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {

    @ViewChild("container") container: ElementRef;
    @ViewChild("icon") icon: ElementRef;
    @ViewChild("email") email: ElementRef;
    @ViewChild("password") password: ElementRef;

    // public members
    public user: User;
    public isLoggingIn: boolean = true;

    // private members

    // functions
    constructor(private routerExtensions: RouterExtensions, private loginService: LoginService, private page: Page, private location: Location) {
	this.user = new User();
    }

    /* ***********************************************************
     * Use the sideDrawerTransition property to change the open/close animation of the drawer.
     *************************************************************/
    ngOnInit(): void {
	this.page.actionBarHidden = true;
	this.page.addCss("Page { background-repeat: no-repeat; background-size: 100% 100%; }");
	//this.page.backgroundImage = "res://bg_login";
    }

    public enterApp(): void {
	this.routerExtensions.navigate(
	    ["/home"], {
	    transition: {
		name: "fade"
	    },
	    clearHistory: true
	    });
    }

    public cancel(): void {
	this.enterApp();
    }
    
    public submit(): void {
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

    public login(): void {
	this.loginService.login(this.user)
	    .subscribe(
		() => this.enterApp(),
		(error) => this.handleErrors(error, "Login Failed", "Unfortunately we couldn't find your account")
	    );
    }

    public signUp(): void {
	this.loginService.register(this.user)
	    .subscribe(
		() => {
		    this.toggleDisplay();
		},
		(error) => this.handleErrors(error, "Register Failed", "Unfortunately we couldn't create your account")
	    );
    }

    private handleErrors(error, message, defaultText): void {
	const errors = error.json && error.json().errors;
	if (errors && errors.length) {
	    alert(`${message}:\n${errors.join('\n')}`);
	}
	else if (errors && errors.full_messages) {
	    alert(`${message}:\n${errors.full_messages}`);
	}
	else {
	    alert(defaultText)
	}
    }

    public toggleDisplay(): void {
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

    public setTextFieldColors(): void {
	let emailTextField = <TextField>this.email.nativeElement;
	let passwordTextField = <TextField>this.password.nativeElement;

	let mainTextColor = new Color(this.isLoggingIn ? "black" : "#C4AFB4");
	emailTextField.color = mainTextColor;
	passwordTextField.color = mainTextColor;

	let hintColor = new Color(this.isLoggingIn ? "#AcA6A7" : "#C4AFB4");
	//setHintColor({ view: emailTextField, color: hintColor });
	//setHintColor({ view: passwordTextField, color: hintColor });
    }

}
