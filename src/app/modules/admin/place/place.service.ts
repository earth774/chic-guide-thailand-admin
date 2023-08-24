import { Injectable } from "@angular/core";
import { Place, PlaceQueryParams } from "./place.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class PlaceService {

  private placeCreatedSource = new Subject<Place>();
  private placeDestroyedSource = new Subject<Place>();

  placeCreated$ = this.placeCreatedSource.asObservable();
  placeDestroyed$ = this.placeDestroyedSource.asObservable();

  onPlaceCreated(place: Place) {
    this.placeCreatedSource.next(place);
  }

  onPlaceDestroyed(place: Place) {
    this.placeDestroyedSource.next(place);
  }

  find(params: PlaceQueryParams): Promise<ParseQueryResult<Place>> {
    return Parse.Cloud.run('getPlacesWithUser', params) as Promise<ParseQueryResult<Place>>;
  }

  findOne(id: string): Promise<Place> {
    return Parse.Cloud.run('getPlaceWithUser', { id});
  }
}