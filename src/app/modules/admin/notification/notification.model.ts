import { ParseUser } from 'app/core/user/parse-user.model';
import * as Parse from 'parse';
import { Category } from '../category/category.model';
import { Place } from '../place/place.model';
import { Post } from '../post/post.model';

export class Notification extends Parse.Object {

  constructor() {
    super('Notification');
  }

  get title(): string {
    return this.get('title');
  }

  set title(value: string) {
    this.set('title', value);
  }

  get message(): string {
    return this.get('message');
  }

  set message(value: string) {
    this.set('message', value);
  }

  get bounds(): any {
    return this.get('bounds');
  }

  set bounds(value: any) {
    this.set('bounds', value);
  }

  get radius(): number {
    return this.get('radius');
  }

  set radius(value: number) {
    this.set('radius', value);
  }

  get address(): string {
    return this.get('address');
  }

  set address(value: string) {
    this.set('address', value);
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

  get latitude(): number {
    return this.get('latitude');
  }

  set latitude(value: number) {
    this.set('latitude', value);
  }

  get longitude(): number {
    return this.get('longitude');
  }

  set longitude(value: number) {
    this.set('longitude', value);
  }

  get type(): string {
    return this.get('type');
  }

  set type(value: string) {
    this.set('type', value);
  }

  get users(): ParseUser[] {
    return this.get('users');
  }

  set users(value: ParseUser[]) {
    this.set('users', value);
  }

  get attachmentType(): string {
    return this.get('attachmentType');
  }

  set attachmentType(value: string) {
    this.set('attachmentType', value);
  }

  get place(): Place {
    return this.get('place');
  }

  set place(value: Place) {
    this.set('place', value);
  }

  get post(): Post {
    return this.get('post');
  }

  set post(value: Post) {
    this.set('post', value);
  }

  get category(): Category {
    return this.get('category');
  }

  set category(value: Category) {
    this.set('category', value);
  }
}

Parse.Object.registerSubclass('Notification', Notification);