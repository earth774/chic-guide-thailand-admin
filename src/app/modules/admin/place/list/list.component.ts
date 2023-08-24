import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { debounceTime, filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Place, PlaceQueryParams } from 'app/modules/admin/place/place.model';
import { PlaceService } from 'app/modules/admin/place/place.service';
import { Status } from 'app/core/enum/status.enum';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { FuseAlertType } from '@fuse/components/alert';
import { Pagination } from 'app/core/interface/pagination.interface';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Category } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';
import { ParseUserService } from 'app/core/user/parse-user.service';

@Component({
  selector: 'app-place-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  public drawerMode: 'side' | 'over';
  public places: Place[] = [];
  public categories: Category[] = [];
  public placeCount: number;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public searchInputControl: FormControl = new FormControl();
  public filterStatusSelectControl: FormControl = new FormControl();
  public filterCategoryAutocompleteControl: FormControl = new FormControl();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public placeQueryParams: PlaceQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  public statusOpts = [
    Status.pending,
    Status.pending_approval,
    Status.approved,
    Status.rejected,
    Status.expired,
  ];

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private placeService: PlaceService,
    private categoryService: CategoryService,
    private userService: ParseUserService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.loadPlaces();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.placeService.placeCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(place => {
        this.places = [place, ...this.places];
        this.placeCount++;
        this.pagination.length = this.placeCount;

        if (this.places.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.placeService.placeDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(place => {
        this.places = this.places.filter(c => c.id !== place.id);
        this.placeCount--;
        this.pagination.length = this.placeCount;

        if (this.places.length) {
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
          this.placeQueryParams.query = query;
          this.paginator.firstPage();
          return this.loadPlaces();
        })
      ).subscribe();

    this.filterStatusSelectControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll),
        debounceTime(300),
        switchMap(query => {
          this.placeQueryParams.status = query;
          this.paginator.firstPage();
          return this.loadPlaces();
        })
      ).subscribe();

    this.filterCategoryAutocompleteControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll),
        debounceTime(300),
        switchMap(query => {
          if (typeof query === 'string') {

            if (query.length === 0) {
              this.placeQueryParams.categories = null;
              this.paginator.firstPage();
              this.loadPlaces();
            }

            return this.onSearchCategories(query);
          }
          return new Observable;
        })
      ).subscribe();
  }

  onSortChanged(sortState: Sort): void {
    this.placeQueryParams.sort = {
      field: sortState.active,
      direction: sortState.direction,
    };
    this.loadPlaces();
  }

  onPageChanged(event: PageEvent): void {
    this.placeQueryParams.page = event.pageIndex + 1;
    this.placeQueryParams.limit = event.pageSize;
    this.loadPlaces();
  }

  async loadPlaces() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { results, count } = await this.placeService.find(this.placeQueryParams);
      this.places = results;
      this.placeCount = count;
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

  async onSearchCategories(query: string): Promise<void> {

    if (query) {

      const params: ParseQueryParams = {
        query: query,
        limit: 10,
        sort: {
          field: 'title',
          direction: 'asc',
        }
      };

      const { results } = await this.categoryService.find(params);
      this.categories = results;

    } else {
      this.categories = [];
    }

    this.changeDetectorRef.markForCheck();

  }

  onCategorySelected(event: MatAutocompleteSelectedEvent) {
    const category = event.option.value as Category;

    if (category) {
      this.placeQueryParams.categories = [category.toPointer()];
      this.paginator.firstPage();
      this.loadPlaces();
    }

  }

  displayCategoryWith(value: any): string {
    return value?.title;
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
