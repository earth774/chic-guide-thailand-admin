import { ParseQueryParams } from 'app/core/interface/query.interface';
import { ParseUser } from 'app/core/user/parse-user.model';
import * as Parse from 'parse';
import { Category } from '../category/category.model';


export interface PlaceQueryParams extends ParseQueryParams {
  categories?: Parse.Pointer[];
};

export class Place extends Parse.Object {

  constructor() {
    super('Place');
  }

  get isFeaturedNonExpired(): boolean {
    return this.isFeatured &&
      this.featuredExpiresAt &&
      this.featuredExpiresAt > new Date;
  }

  get title(): string {
    return this.get('title');
  }

  set title(value: string) {
    this.set('title', value);
  }

  get description(): string {
    return this.get('description');
  }

  set description(value: string) {
    this.set('description', value);
  }

  get longDescription(): string {
    return this.get('longDescription');
  }

  set longDescription(value: string) {
    this.set('longDescription', value);
  }

  get categories(): Category[] {
    return this.get('categories') || [];
  }

  set categories(value: Category[]) {
    this.set('categories', value);
  }

  get user(): ParseUser {
    return this.get('user');
  }

  set user(value: ParseUser) {
    this.set('user', value);
  }

  get googlePhotos(): string[] {
    return this.get('googlePhotos') || [];
  }

  set googlePhotos(value: string[]) {
    this.set('googlePhotos', value);
  }

  get images(): Parse.File[] {
    return this.get('images') || [];
  }

  set images(value: Parse.File[]) {
    this.set('images', value);
  }

  get image(): Parse.File {
    return this.get('image');
  }

  set image(value: Parse.File) {
    this.set('image', value);
  }

  get icon(): Parse.File {
    return this.get('icon');
  }

  set icon(value: Parse.File) {
    this.set('icon', value);
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

  get expiresAt(): Date {
    return this.get('expiresAt');
  }

  set expiresAt(value: Date) {
    this.set('expiresAt', value);
  }

  get featuredExpiresAt(): Date {
    return this.get('featuredExpiresAt');
  }

  set featuredExpiresAt(value: Date) {
    this.set('featuredExpiresAt', value);
  }

  get isFeatured(): boolean {
    return this.get('isFeatured');
  }

  set isFeatured(value: boolean) {
    this.set('isFeatured', value);
  }

  get website(): string {
    return this.get('website');
  }

  set website(value: string) {
    this.set('website', value);
  }

  get phone(): string {
    return this.get('phone');
  }

  set phone(value: string) {
    this.set('phone', value);
  }

  get email(): string {
    return this.get('email');
  }

  set email(value: string) {
    this.set('email', value);
  }

  get whatsapp(): string {
    return this.get('whatsapp');
  }

  set whatsapp(value: string) {
    this.set('whatsapp', value);
  }

  get facebook(): string {
    return this.get('facebook');
  }

  set facebook(value: string) {
    this.set('facebook', value);
  }

  get instagram(): string {
    return this.get('instagram');
  }

  set instagram(value: string) {
    this.set('instagram', value);
  }

  get youtube(): string {
    return this.get('youtube');
  }

  set youtube(value: string) {
    this.set('youtube', value);
  }

  get tags(): string[] {
    return this.get('tags') || [];
  }

  set tags(value: string[]) {
    this.set('tags', value);
  }

  get address(): string {
    return this.get('address');
  }

  set address(value: string) {
    this.set('address', value);
  }

  get priceRange(): string {
    return this.get('priceRange');
  }

  set priceRange(value: string) {
    this.set('priceRange', value);
  }

  get location(): Parse.GeoPoint {
    return this.get('location');
  }

  set location(value: { latitude: number, longitude: number } | Parse.GeoPoint) {
    this.set('location', new Parse.GeoPoint([
      value.latitude,
      value.longitude,
    ]));
  }
}

Parse.Object.registerSubclass('Place', Place);