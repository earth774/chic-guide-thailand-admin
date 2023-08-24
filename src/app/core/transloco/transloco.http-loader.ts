import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Translation, TranslocoLoader } from '@ngneat/transloco';

@Injectable({
  providedIn: 'root'
})
export class TranslocoHttpLoader implements TranslocoLoader {

  constructor(private httpClient: HttpClient) {}

  /**
   * Get translation
   *
   * @param lang
   */
  getTranslation(lang: string): Observable<Translation> {
    return this.httpClient.get<Translation>(`./assets/i18n/${lang}.json`);
  }
}
