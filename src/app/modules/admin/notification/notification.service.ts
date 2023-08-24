import { Injectable } from "@angular/core";
import { Notification } from "./notification.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationCreatedSource = new Subject<Notification>();
  private notificationDestroyedSource = new Subject<Notification>();

  notificationCreated$ = this.notificationCreatedSource.asObservable();
  notificationDestroyed$ = this.notificationDestroyedSource.asObservable();

  onNotificationCreated(notification: Notification) {
    this.notificationCreatedSource.next(notification);
  }

  onNotificationDestroyed(notification: Notification) {
    this.notificationDestroyedSource.next(notification);
  }

  async find(params: ParseQueryParams): Promise<ParseQueryResult<Notification>> {
    const query = new Parse.Query(Notification);

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

    return query.find() as ParseQueryResult<Notification>;
  }

  findOne(id: string): Promise<Notification> {
    const query = new Parse.Query(Notification);
    return query.get(id);
  }
}