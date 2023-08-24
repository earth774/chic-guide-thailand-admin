import * as Parse from 'parse';

export class Category extends Parse.Object {

  constructor() {
    super('Category');
  }

  static getInstance() {
    return this;
  }

  get title(): string {
    return this.get('title');
  }

  set title(value: string) {
    this.set('title', value);
  }

  get order(): number {
    return this.get('order');
  }

  set order(value: number) {
    this.set('order', value);
  }

  get isFeatured(): boolean {
    return this.get('isFeatured');
  }

  set isFeatured(value: boolean) {
    this.set('isFeatured', value);
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
}

Parse.Object.registerSubclass('Category', Category);