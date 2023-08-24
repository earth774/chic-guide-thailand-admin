import { Injectable } from "@angular/core";
import { UserPackage } from "./user-package.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class UserPackageService {

  private userPackageCreatedSource = new Subject<UserPackage>();
  private userPackageDestroyedSource = new Subject<UserPackage>();

  userPackageCreated$ = this.userPackageCreatedSource.asObservable();
  userPackageDestroyed$ = this.userPackageDestroyedSource.asObservable();

  onUserPackageCreated(userPackageModel: UserPackage) {
    this.userPackageCreatedSource.next(userPackageModel);
  }

  onUserPackageDestroyed(userPackageModel: UserPackage) {
    this.userPackageDestroyedSource.next(userPackageModel);
  }

  find(params: ParseQueryParams): Promise<ParseQueryResult<UserPackage>> {
    return Parse.Cloud.run('getUserPackagesWithUser', params) as Promise<ParseQueryResult<UserPackage>>;
  }
}