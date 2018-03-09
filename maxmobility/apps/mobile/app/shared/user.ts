const validator = require('email-validator');

export class User {
  loggedIn: boolean = false;
  email: string = '';
  accessToken: string = '';
  client: string = '';
  uid: string = '';
  password: string = '';
  reentered_password: string = '';
  wristband_serial_number: string = '';
  smartdrive_serial_number: string = '';
  login_state: string = '';
  error_message: string = '';
  name: string = '';
  year_of_birth: number = 1988;
  gender: string = '';
  ability: string;
  isValidEmail(): boolean {
    return validator.validate(this.email);
  }
}
