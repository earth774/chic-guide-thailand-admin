import * as Parse from 'parse';
import { Place } from '../place/place.model';

export class Post extends Parse.Object {

  constructor() {
    super('Post');
  }

  get title(): string {
    return this.get('title');
  }

  set title(value: string) {
    this.set('title', value);
  }

  get body(): string {
    return this.get('body');
  }

  set body(value: string) {
    this.set('body', value);
  }

  get htmlBody(): string {
    return this.get('htmlBody');
  }

  set htmlBody(value: string) {
    this.set('htmlBody', value);
  }

  get place(): Place {
    return this.get('place');
  }

  set place(value: Place) {
    this.set('place', value);
  }

  get image(): Parse.File {
    return this.get('image');
  }

  set image(value: Parse.File) {
    this.set('image', value);
  }

  get imageThumb(): Parse.File {
    return this.get('imageThumb');
  }

  set imageThumb(value: Parse.File) {
    this.set('imageThumb', value);
  }

  get status(): string {
    return this.get('status');
  }

  set status(value: string) {
    this.set('status', value);
  }

  get isPushEnabled(): boolean {
    return this.get('isPushEnabled');
  }

  set isPushEnabled(value: boolean) {
    this.set('isPushEnabled', value);
  }
}

Parse.Object.registerSubclass('Post', Post);