import { Injectable } from "@angular/core";
import { Package } from "./package.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class PackageService {

  private packageCreatedSource = new Subject<Package>();
  private packageDestroyedSource = new Subject<Package>();

  packageCreated$ = this.packageCreatedSource.asObservable();
  packageDestroyed$ = this.packageDestroyedSource.asObservable();

  onPackageCreated(packageModel: Package) {
    this.packageCreatedSource.next(packageModel);
  }

  onPackageDestroyed(packageModel: Package) {
    this.packageDestroyedSource.next(packageModel);
  }

  async find(params: ParseQueryParams): Promise<ParseQueryResult<Package>> {
    const query = new Parse.Query(Package);

    if (params?.query) {
      query.contains('canonical', params.query.toLowerCase());
    }

    if (params?.limit) {
      query.limit(params.limit);
    }

    if (params?.limit && params?.page) {
      const skip = params.limit * (params.page - 1);
      query.skip(skip);
    }

    query.descending('createdAt');

    if (params?.sort?.direction === 'asc') {
      query.ascending(params.sort?.field);
    } else if (params?.sort?.direction === 'desc') {
      query.descending(params.sort?.field);
    }

    query.withCount();
    query.doesNotExist('deletedAt');

    return query.find() as ParseQueryResult<Package>;
  }

  findOne(id: string): Promise<Package> {
    const query = new Parse.Query(Package);
    return query.get(id);
  }
}