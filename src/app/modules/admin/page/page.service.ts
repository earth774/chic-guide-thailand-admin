import { Injectable } from "@angular/core";
import { Page } from "./page.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class PageService {

  private pageCreatedSource = new Subject<Page>();
  private pageDestroyedSource = new Subject<Page>();

  pageCreated$ = this.pageCreatedSource.asObservable();
  pageDestroyed$ = this.pageDestroyedSource.asObservable();

  onPageCreated(page: Page) {
    this.pageCreatedSource.next(page);
  }

  onPageDestroyed(page: Page) {
    this.pageDestroyedSource.next(page);
  }

  async find(params: ParseQueryParams): Promise<ParseQueryResult<Page>> {
    const query = new Parse.Query(Page);

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

    return query.find() as ParseQueryResult<Page>;
  }

  findOne(id: string): Promise<Page> {
    const query = new Parse.Query(Page);
    return query.get(id);
  }
}