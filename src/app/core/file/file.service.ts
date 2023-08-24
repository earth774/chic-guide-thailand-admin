import { Injectable } from '@angular/core';
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  public upload(
    data: any,
    filename: string,
    isBase64: boolean = true,
    saveImmediately: boolean = true): Promise<Parse.File> | Parse.File {

    const filenameSanitized = filename
      .replace(/[^a-zA-Z0-9-_\.]/g, '')
      .toLowerCase();

    const file = isBase64 ? { base64: data } : data;

    const parseFile = new Parse.File(filenameSanitized, file);

    if (saveImmediately) {
      return parseFile.save();
    }

    return parseFile;
  }

}
