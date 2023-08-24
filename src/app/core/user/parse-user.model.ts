import * as Parse from 'parse';
import { ParseQueryParams } from '../interface/query.interface';

export enum ParseUserType {
  super_admin = 'super_admin',
  admin = 'admin',
  customer = 'customer',
};

export interface ParseUserQueryParams extends ParseQueryParams {
  type?: string;
  canonical?: string;
  orderBy?: string,
  orderByField?: string,
};

export class ParseUser extends Parse.User {

  isAnonymous(): boolean {
    return this.authData && this.authData['anonymous'];
  }

  isCustomer(): boolean {
    return this.type === ParseUserType.customer;
  }

  isAdmin(): boolean {
    return this.type === ParseUserType.admin;
  }

  isSuperAdmin(): boolean {
    return this.type === ParseUserType.super_admin;
  }

  get description(): string {

    if (!this.name) {
      return;
    }

    let description = this.name;

    if (this.authData?.facebook) {
      description += ' (Facebook)';
    } else if (this.authData?.google) {
      description += ' (Google)';
    } else if (this.authData?.apple) {
      description += ' (Apple)';
    } else {
      description += ' (' + this.username + ')';
    }

    return description;
  }

  get name(): string {
    return this.get('name');
  }

  set name(val: string) {
    this.set('name', val);
  }

  get username(): string {
    return this.getUsername();
  }

  set username(val: string) {
    this.setUsername(val);
  }

  get email(): string {
    return this.getEmail();
  }

  set email(val: string) {
    this.setEmail(val);
  }

  get password(): string {
    return this.get('password');
  }

  set password(val: string) {
    this.setPassword(val);
  }

  get photo(): Parse.File {
    return this.get('photo');
  }

  set photo(val: Parse.File) {
    this.set('photo', val);
  }

  get permissions(): string[] {
    return this.get('permissions') || [];
  }

  set permissions(val: string[]) {
    this.set('permissions', val);
  }

  get type(): string {
    return this.get('type');
  }

  set type(val: string) {
    this.set('type', val);
  }

  get authData(): any {
    return this.get('authData');
  }
}

Parse.Object.registerSubclass('_User', ParseUser);