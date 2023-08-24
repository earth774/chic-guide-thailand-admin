import { Injectable } from "@angular/core";
import { SliderImage } from "./slider-image.model";
import * as Parse from 'parse';
import { Subject } from "rxjs";
import { ParseQueryParams, ParseQueryResult } from "app/core/interface/query.interface";

@Injectable({
  providedIn: 'root'
})
export class SliderImageService {

  private sliderImageCreatedSource = new Subject<SliderImage>();
  private sliderImageDestroyedSource = new Subject<SliderImage>();

  sliderImageCreated$ = this.sliderImageCreatedSource.asObservable();
  sliderImageDestroyed$ = this.sliderImageDestroyedSource.asObservable();

  onSliderImageCreated(sliderImage: SliderImage) {
    this.sliderImageCreatedSource.next(sliderImage);
  }

  onSliderImageDestroyed(sliderImage: SliderImage) {
    this.sliderImageDestroyedSource.next(sliderImage);
  }

  async find(params: ParseQueryParams): Promise<ParseQueryResult<SliderImage>> {
    const query = new Parse.Query(SliderImage);

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
    query.include(['category', 'place', 'post']);
    query.doesNotExist('deletedAt');

    return query.find() as ParseQueryResult<SliderImage>;
  }

  findOne(id: string): Promise<SliderImage> {
    const query = new Parse.Query(SliderImage);
    return query.get(id);
  }

  delete(sliderImage: SliderImage): Promise<SliderImage> {
    return sliderImage.destroy();
  }
}