import { User } from './user';

export class Config {
  static apiUrl = 'http://api.max-mobility.com/api/v1/';
  // related to logging in
  static token = '';
  static client = '';
  static uid = '';
  static user = new User();
}
