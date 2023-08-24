import { ParseQueryParams } from 'app/core/interface/query.interface';
import { ParseUser } from 'app/core/user/parse-user.model';
import * as Parse from 'parse';
import { Place } from '../place/place.model';

export interface ReviewQueryParams extends ParseQueryParams {
  place?: Parse.Pointer;
};

export class Review extends Parse.Object {

  constructor() {
    super('Review');
  }

  get comment(): string {
    return this.get('comment');
  }

  set comment(value: string) {
    this.set('comment', value);
  }

  get rating(): number {
    return this.get('rating');
  }

  set rating(value: number) {
    this.set('rating', value);
  }

  get user(): ParseUser {
    return this.get('user');
  }

  set user(value: ParseUser) {
    this.set('user', value);
  }

  get place(): Place {
    return this.get('place');
  }

  set place(value: Place) {
    this.set('place', value);
  }

  get status(): string {
    return this.get('status');
  }

  set status(value: string) {
    this.set('status', value);
  }
}

Parse.Object.registerSubclass('Review', Review);