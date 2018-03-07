const validator = require("email-validator");

export class User {
    public loggedIn: boolean = false;
    
    public email: string = "";
    public accessToken: string = "";
    public client: string = "";
    public uid: string = "";
    public password: string = "";
    public reentered_password: string = "";
    public wristband_serial_number: string = "";
    public smartdrive_serial_number: string = "";
    public login_state: string = "";
    public error_message: string = "";
    public name: string = "";
    public year_of_birth: number = 1988;
    public gender: string = "";
    public ability: string = "";

    public isValidEmail(): boolean {
        return validator.validate(this.email);
    }
}
