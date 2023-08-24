import { Injectable } from "@angular/core";
import { Review } from "./review.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private reviewCreatedSource = new Subject<Review>();
  private reviewDestroyedSource = new Subject<Review>();

  reviewCreated$ = this.reviewCreatedSource.asObservable();
  reviewDestroyed$ = this.reviewDestroyedSource.asObservable();

  onReviewCreated(reviewModel: Review) {
    this.reviewCreatedSource.next(reviewModel);
  }

  onReviewDestroyed(reviewModel: Review) {
    this.reviewDestroyedSource.next(reviewModel);
  }

  find(params: ParseQueryParams): Promise<ParseQueryResult<Review>> {
    return Parse.Cloud.run('getReviewsWithUser', params) as Promise<ParseQueryResult<Review>>;
  }

  findOne(id: string): Promise<Review> {
    return Parse.Cloud.run('getReviewWithUser', { id});
  }
}