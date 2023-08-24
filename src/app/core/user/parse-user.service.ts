import { Injectable } from "@angular/core";
import { ParseUser } from "./parse-user.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ParseUserService {

  constructor() { }

  private userCreatedSource = new Subject<ParseUser>();
  private userDestroyedSource = new Subject<ParseUser>();
  private userSessionExpiredSource = new Subject<boolean>();

  userCreated$ = this.userCreatedSource.asObservable();
  userDestroyed$ = this.userDestroyedSource.asObservable();
  userSessionExpired$ = this.userSessionExpiredSource.asObservable();

  onUserCreated(user: ParseUser) {
    this.userCreatedSource.next(user);
  }

  onUserDestroyed(user: ParseUser) {
    this.userDestroyedSource.next(user);
  }

  onUserSessionExpired() {
    this.userSessionExpiredSource.next(true);
  }

  find(params: any = {}): Promise<{ total: number, users: ParseUser[] }> {
    return Parse.Cloud.run('getUsers', params);
  }

  canLogin(username: string): Promise<boolean> {
    return Parse.Cloud.run('canLogin', { username });
  }

  login(params: any = {}): Promise<boolean> {
    return Parse.Cloud.run('loginInCloud', params);
  }

  findOne(id: string): Promise<ParseUser> {
    return Parse.Cloud.run('getUser', { id });
  }

  createOrUpdate(data: any = {}): Promise<ParseUser> {
    if (data.objectId) {
      return Parse.Cloud.run('updateUser', data);
    } else {
      return Parse.Cloud.run('createUser', data);
    }
  }

  delete(id: string): Promise<ParseUser> {
    return Parse.Cloud.run('destroyUser', { id });
  }
}