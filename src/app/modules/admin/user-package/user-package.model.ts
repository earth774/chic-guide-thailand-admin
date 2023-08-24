import { ParseUser } from 'app/core/user/parse-user.model';
import * as Parse from 'parse';

export class UserPackage extends Parse.Object {

  constructor() {
    super('UserPackage');
  }

  static getInstance() {
    return this;
  }

  get package(): any {
    return this.get('package');
  }

  set package(value: any) {
    this.set('package', value);
  }

  get user(): ParseUser {
    return this.get('user');
  }

  set user(value: ParseUser) {
    this.set('user', value);
  }

  get charge(): any {
    return this.get('charge');
  }

  set charge(value: any) {
    this.set('charge', value);
  }

  get status(): string {
    return this.get('status');
  }

  set status(value: string) {
    this.set('status', value);
  }

  get deletedAt(): Date {
    return this.get('deletedAt');
  }

  set deletedAt(value: Date) {
    this.set('deletedAt', value);
  }
}

Parse.Object.registerSubclass('UserPackage', UserPackage);