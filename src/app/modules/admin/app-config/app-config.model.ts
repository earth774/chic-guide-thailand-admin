import * as Parse from 'parse';

export class AppConfig extends Parse.Object {

  constructor() {
    super('AppConfig');
  }

  get about(): any {
    return this.get('about');
  }

  get reviews(): any {
    return this.get('reviews');
  }

  get slides(): any {
    return this.get('slides');
  }

  get places(): any {
    return this.get('places');
  }

  get auth(): any {
    return this.get('auth');
  }

  get email(): any {
    return this.get('email');
  }

  get stripePublicKey(): string {
    return this.get('stripePublicKey');
  }
}

Parse.Object.registerSubclass('AppConfig', AppConfig);