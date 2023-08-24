import { Injectable } from "@angular/core";
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class ParseService {

  constructor() { }

  getCollectionsCount(): Promise<{ [key: string]: number }> {
    return Parse.Cloud.run('getCollectionsCount');
  }

  getServerHealth(): Promise<{ status: string }> {
    return (Parse as any).getServerHealth();
  }

}