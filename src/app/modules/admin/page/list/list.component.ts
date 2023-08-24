import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { debounceTime, filter, fromEvent, Subject, switchMap, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Page } from 'app/modules/admin/page/page.model';
import { PageService } from 'app/modules/admin/page/page.service';
import { Status } from 'app/core/enum/status.enum';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { FuseAlertType } from '@fuse/components/alert';
import { Pagination } from 'app/core/interface/pagination.interface';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { ParseUserService } from 'app/core/user/parse-user.service';

@Component({
  selector: 'app-page-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  public drawerMode: 'side' | 'over';
  public pages: Page[] = [];
  public pageCount: number;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public searchInputControl: FormControl = new FormControl();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public pageQueryParams: ParseQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private pageService: PageService,
    private userService: ParseUserService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.loadPages();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.pageService.pageCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(page => {
        this.pages = [page, ...this.pages];
        this.pageCount++;
        this.pagination.length = this.pageCount;

        if (this.pages.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.pageService.pageDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(page => {
        this.pages = this.pages.filter(c => c.id !== page.id);
        this.pageCount--;
        this.pagination.length = this.pageCount;

        if (this.pages.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Subscribe to media query change
    this.fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((state) => {
        this.drawerMode = state.matches ? 'side' : 'over';
        this.changeDetectorRef.markForCheck();
      });

    // Listen for shortcuts
    fromEvent(this.document, 'keydown')
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter<KeyboardEvent>(event =>
          (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
          && (event.key === '/' || event.key === '.') // '/' or '.' key
        )
      )
      .subscribe((event: KeyboardEvent) => {
        if (event.key === '/') {
          this.onCreateButtonClicked();
        }
      });

    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll),
        debounceTime(300),
        switchMap(query => {
          this.pageQueryParams.query = query;
          this.paginator.firstPage();
          return this.loadPages();
        })
      ).subscribe();
  }

  onSortChanged(sortState: Sort): void {
    this.pageQueryParams.sort = {
      field: sortState.active,
      direction: sortState.direction,
    };
    this.loadPages();
  }

  onPageChanged(event: PageEvent): void {
    this.pageQueryParams.page = event.pageIndex + 1;
    this.pageQueryParams.limit = event.pageSize;
    this.loadPages();
  }

  async loadPages() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { results, count } = await this.pageService.find(this.pageQueryParams);
      this.pages = results;
      this.pageCount = count;
      this.pagination.length = count;

      if (results.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

    } catch (error) {
      this.showErrorView();

      if (error.code === 209) {
        this.userService.onUserSessionExpired();
      }

    } finally {
      this.changeDetectorRef.markForCheck();
    }
  }

  onCreateButtonClicked() {
    this.navigateToRelative('./new');
    this.changeDetectorRef.markForCheck();
  }

  onBackdropClicked(): void {
    this.navigateToRelative('./');
    this.changeDetectorRef.markForCheck();
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
