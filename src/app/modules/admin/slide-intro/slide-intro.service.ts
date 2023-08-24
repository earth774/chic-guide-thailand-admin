import { Injectable } from "@angular/core";
import { SlideIntro } from "./slide-intro.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class SlideIntroService {

  private slideIntroCreatedSource = new Subject<SlideIntro>();
  private slideIntroDestroyedSource = new Subject<SlideIntro>();

  slideIntroCreated$ = this.slideIntroCreatedSource.asObservable();
  slideIntroDestroyed$ = this.slideIntroDestroyedSource.asObservable();

  onSlideIntroCreated(slideIntro: SlideIntro) {
    this.slideIntroCreatedSource.next(slideIntro);
  }

  onSlideIntroDestroyed(slideIntro: SlideIntro) {
    this.slideIntroDestroyedSource.next(slideIntro);
  }

  async find(params: ParseQueryParams): Promise<ParseQueryResult<SlideIntro>> {
    const query = new Parse.Query(SlideIntro);

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

    return query.find() as ParseQueryResult<SlideIntro>;
  }

  findOne(id: string): Promise<SlideIntro> {
    const query = new Parse.Query(SlideIntro);
    return query.get(id);
  }
}