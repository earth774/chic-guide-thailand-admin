import * as Parse from 'parse';

export class Package extends Parse.Object {

  constructor() {
    super('Package');
  }

  get name(): string {
    return this.get('name');
  }

  set name(value: string) {
    this.set('name', value);
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

  get price(): number {
    return this.get('price');
  }

  set price(value: number) {
    this.set('price', value);
  }

  get salePrice(): number {
    return this.get('salePrice');
  }

  set salePrice(value: number) {
    this.set('salePrice', value);
  }

  get finalPrice(): number {
    return this.get('finalPrice');
  }

  set finalPrice(value: number) {
    this.set('finalPrice', value);
  }

  get disableMultiplePurchases(): boolean {
    return this.get('disableMultiplePurchases');
  }

  set disableMultiplePurchases(value: boolean) {
    this.set('disableMultiplePurchases', value);
  }

  get markListingAsFeatured(): boolean {
    return this.get('markListingAsFeatured');
  }

  set markListingAsFeatured(value: boolean) {
    this.set('markListingAsFeatured', value);
  }

  get autoApproveListing(): boolean {
    return this.get('autoApproveListing');
  }

  set autoApproveListing(value: boolean) {
    this.set('autoApproveListing', value);
  }

  get listingLimit(): number {
    return this.get('listingLimit');
  }

  set listingLimit(value: number) {
    this.set('listingLimit', value);
  }

  get listingDuration(): number {
    return this.get('listingDuration');
  }

  set listingDuration(value: number) {
    this.set('listingDuration', value);
  }

  get status(): string {
    return this.get('status');
  }

  set status(value: string) {
    this.set('status', value);
  }

  get type(): string {
    return this.get('type');
  }

  set type(value: string) {
    this.set('type', value);
  }

  get deletedAt(): string {
    return this.get('deletedAt');
  }

  set deletedAt(value: string) {
    this.set('deletedAt', value);
  }
}

Parse.Object.registerSubclass('Package', Package);