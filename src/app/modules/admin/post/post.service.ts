import { Injectable } from "@angular/core";
import { Post } from "./post.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private postCreatedSource = new Subject<Post>();
  private postDestroyedSource = new Subject<Post>();

  postCreated$ = this.postCreatedSource.asObservable();
  postDestroyed$ = this.postDestroyedSource.asObservable();

  onPostCreated(post: Post) {
    this.postCreatedSource.next(post);
  }

  onPostDestroyed(post: Post) {
    this.postDestroyedSource.next(post);
  }

  async find(params: ParseQueryParams): Promise<ParseQueryResult<Post>> {
    const query = new Parse.Query(Post);

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
    query.include(['place']);
    query.doesNotExist('deletedAt');

    return query.find() as ParseQueryResult<Post>;
  }

  findOne(id: string): Promise<Post> {
    const query = new Parse.Query(Post);
    return query.get(id);
  }
}