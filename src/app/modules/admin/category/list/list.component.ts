import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { debounceTime, filter, fromEvent, Subject, switchMap, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Category } from 'app/modules/admin/category/category.model';
import { CategoryService } from 'app/modules/admin/category/category.service';
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
  selector: 'app-category-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  public drawerMode: 'side' | 'over';
  public selectedCategory: Category;
  public categories: Category[] = [];
  public categoryCount: number;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public searchInputControl: FormControl = new FormControl();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public categoryQueryParams: ParseQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private categoryService: CategoryService,
    private userService: ParseUserService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.categoryService.categoryCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(category => {
        this.categories = [category, ...this.categories];
        this.categoryCount++;
        this.pagination.length = this.categoryCount;

        if (this.categories.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.categoryService.categoryDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(category => {
        this.categories = this.categories.filter(c => c.id !== category.id);
        this.categoryCount--;
        this.pagination.length = this.categoryCount;

        if (this.categories.length) {
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
          this.categoryQueryParams.query = query;
          this.paginator.firstPage();
          return this.loadCategories();
        })
      ).subscribe();
  }

  onSortChanged(sortState: Sort): void {
    this.categoryQueryParams.sort = {
      field: sortState.active,
      direction: sortState.direction,
    };
    this.loadCategories();
  }

  onPageChanged(event: PageEvent): void {
    this.categoryQueryParams.page = event.pageIndex + 1;
    this.categoryQueryParams.limit = event.pageSize;
    this.loadCategories();
  }

  async loadCategories() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { results, count } = await this.categoryService.find(this.categoryQueryParams);
      this.categories = results;
      this.categoryCount = count;
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
