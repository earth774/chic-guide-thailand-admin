import { Injectable } from "@angular/core";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { TranslocoService } from "@ngneat/transloco";

@Injectable({
  providedIn: "root",
})
export class Paginator extends MatPaginatorIntl {

  public itemsPerPageLabel: string;
  public firstPageLabel: string;
  public lastPageLabel: string;
  public previousPageLabel: string;
  public nextPageLabel: string;

  constructor(private translocoService: TranslocoService) {
    super();

   this.translocoService.selectTranslate([
      'ITEMS_PER_PAGE',
      'FIRST_PAGE_LABEL',
      'LAST_PAGE_LABEL',
      'PREVIOUS_PAGE_LABEL',
      'NEXT_PAGE_LABEL',
    ]).subscribe(transValues => {
      this.itemsPerPageLabel = transValues[0];
      this.firstPageLabel = transValues[1];
      this.lastPageLabel = transValues[2];
      this.previousPageLabel = transValues[3];
      this.nextPageLabel = transValues[4];
      this.changes.next();
    });

  }

  getRangeLabel = (page: number, pageSize: number, length: number) => {

    const transValue = this.translocoService.translate('OF_LABEL');

    if (length === 0 || pageSize === 0) {
      return `0 ${transValue} ${length}`;
    }

    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ${transValue} ${length}`;
  }
}