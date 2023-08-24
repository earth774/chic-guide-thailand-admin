import { Injectable } from "@angular/core";
import { Category } from "./category.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private categoryCreatedSource = new Subject<Category>();
  private categoryDestroyedSource = new Subject<Category>();

  categoryCreated$ = this.categoryCreatedSource.asObservable();
  categoryDestroyed$ = this.categoryDestroyedSource.asObservable();

  onCategoryCreated(category: Category) {
    this.categoryCreatedSource.next(category);
  }

  onCategoryDestroyed(category: Category) {
    this.categoryDestroyedSource.next(category);
  }

  async find(params: ParseQueryParams): Promise<ParseQueryResult<Category>> {
    const query = new Parse.Query(Category);

    if (params?.query) {
      query.contains('canonical', params.query.toLowerCase());
    }

    if (params.exclude) {
      query.notContainedIn('objectId', params.exclude);
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

    return query.find() as ParseQueryResult<Category>;
  }

  findOne(id: string): Promise<Category> {
    const query = new Parse.Query(Category);
    return query.get(id);
  }
}