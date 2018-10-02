export class User {
  first_name = '';
  last_name = '';
  language = '';
  username = '';
  email = '';
  dob = '';
  phone_number = '';
  region = '';
  associated_sd: any[] = [];
  loggedIn = false;
  accessToken = '';
  client = '';
  uid = '';
  password = '';
  wristband_serial_number = '';
  smartdrive_serial_number = '';
  login_state = '';
  gender = '';
  ability = '';
  // data protection
  has_agreed_to_user_agreement = false;
  has_read_privacy_policy = false;
  consent_to_research = false;
  consent_to_product_development = false;
  type = 0;
}

export enum UserTypes {
  'Clinician',
  'Representative'
}
