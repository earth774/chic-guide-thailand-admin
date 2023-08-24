import * as Parse from 'parse';

export class SlideIntro extends Parse.Object {

  constructor() {
    super('SlideIntro');
  }

  get title(): string {
    return this.get('title');
  }

  set title(value: string) {
    this.set('title', value);
  }

  get text(): string {
    return this.get('text');
  }

  set text(value: string) {
    this.set('text', value);
  }

  get sort(): number {
    return this.get('sort');
  }

  set sort(value: number) {
    this.set('sort', value);
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

  get isActive(): boolean {
    return this.get('isActive');
  }

  set isActive(value: boolean) {
    this.set('isActive', value);
  }

  get permission(): string {
    return this.get('permission');
  }

  set permission(value: string) {
    this.set('permission', value);
  }
}

Parse.Object.registerSubclass('SlideIntro', SlideIntro);