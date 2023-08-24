import * as Parse from 'parse';

export class Page extends Parse.Object {

  constructor() {
    super('Page');
  }

  get title(): string {
    return this.get('title');
  }

  set title(value: string) {
    this.set('title', value);
  }

  get content(): string {
    return this.get('content');
  }

  set content(value: string) {
    this.set('content', value);
  }

  get status(): string {
    return this.get('status');
  }

  set status(value: string) {
    this.set('status', value);
  }
}

Parse.Object.registerSubclass('Page', Page);