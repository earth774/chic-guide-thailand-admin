import * as Parse from 'parse';

export class SliderImage extends Parse.Object {

  constructor() {
    super('SliderImage');
  }

  get description(): string {
    return this.get('description');
  }

  set description(value: string) {
    this.set('description', value);
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

  get type(): string {
    return this.get('type');
  }

  set type(value: string) {
    this.set('type', value);
  }

  get place(): any {
    return this.get('place');
  }

  set place(value: any) {
    this.set('place', value);
  }

  get post(): any {
    return this.get('post');
  }

  set post(value: any) {
    this.set('post', value);
  }

  get category(): any {
    return this.get('category');
  }

  set category(value: any) {
    this.set('category', value);
  }

  get url(): string {
    return this.get('url');
  }

  set url(value: string) {
    this.set('url', value);
  }

  get page(): string {
    return this.get('page');
  }

  set page(value: string) {
    this.set('page', value);
  }

  get position(): string {
    return this.get('position');
  }

  set position(value: string) {
    this.set('position', value);
  }
}

Parse.Object.registerSubclass('SliderImage', SliderImage);