import { Injectable } from "@angular/core";
import { AppConfig } from "./app-config.model";
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  get(): Promise<AppConfig> {
    const query = new Parse.Query(AppConfig);
    return query.first();
  }
}