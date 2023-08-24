import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { debounceTime, filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Review, ReviewQueryParams } from 'app/modules/admin/review/review.model';
import { ReviewService } from 'app/modules/admin/review/review.service';
import { Status } from 'app/core/enum/status.enum';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { FuseAlertType } from '@fuse/components/alert';
import { Pagination } from 'app/core/interface/pagination.interface';
import { ParseUserService } from 'app/core/user/parse-user.service';
import { FormControl } from '@angular/forms';
import { PlaceService } from '../../place/place.service';
import { ParseUser, ParseUserQueryParams, ParseUserType } from 'app/core/user/parse-user.model';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Place, PlaceQueryParams } from '../../place/place.model';

@Component({
  selector: 'app-review-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  public drawerMode: 'side' | 'over';
  public reviews: Review[] = [];
  public reviewCount: number;
  public users: ParseUser[] = [];
  public places: Place[] = [];
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public filterStatusSelectControl: FormControl = new FormControl();
  public filterPlaceAutocompleteControl: FormControl = new FormControl();
  public filterUserAutocompleteControl: FormControl = new FormControl();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public reviewQueryParams: ReviewQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  public statusOpts = [
    Status.pending,
    Status.published,
    Status.banned,
  ];

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private reviewService: ReviewService,
    private userService: ParseUserService,
    private placeService: PlaceService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.loadReviews();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.reviewService.reviewCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(reviewModel => {
        this.reviews = [reviewModel, ...this.reviews];
        this.reviewCount++;
        this.pagination.length = this.reviewCount;

        if (this.reviews.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.reviewService.reviewDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(reviewModel => {
        this.reviews = this.reviews.filter(c => c.id !== reviewModel.id);
        this.reviewCount--;
        this.pagination.length = this.reviewCount;

        if (this.reviews.length) {
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

    this.filterStatusSelectControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll),
        debounceTime(300),
        switchMap(query => {
          this.reviewQueryParams.status = query;
          this.paginator.firstPage();
          return this.loadReviews();
        })
      ).subscribe();

      this.filterUserAutocompleteControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll),
        debounceTime(300),
        switchMap(query => {
          if (typeof query === 'string') {

            if (query.length === 0) {
              this.reviewQueryParams.user = null;
              this.paginator.firstPage();
              this.loadReviews();
            }

            return this.onSearchUsers(query);
          }
          return new Observable;
        })
      ).subscribe();

    this.filterPlaceAutocompleteControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll),
        debounceTime(300),
        switchMap(query => {
          if (typeof query === 'string') {

            if (query.length === 0) {
              this.reviewQueryParams.place = null;
              this.paginator.firstPage();
              this.loadReviews();
            }

            return this.onSearchPlaces(query);
          }
          return new Observable;
        })
      ).subscribe();
  }

  onSortChanged(sortState: Sort): void {
    this.reviewQueryParams.sort = {
      field: sortState.active,
      direction: sortState.direction,
    };
    this.loadReviews();
  }

  onPageChanged(event: PageEvent): void {
    this.reviewQueryParams.page = event.pageIndex + 1;
    this.reviewQueryParams.limit = event.pageSize;
    this.loadReviews();
  }

  async loadReviews() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { results, count } = await this.reviewService.find(this.reviewQueryParams);
      this.reviews = results;
      this.reviewCount = count;
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

  async onSearchUsers(query: string): Promise<void> {

    if (query) {

      const params: ParseUserQueryParams = {
        canonical: query.toLowerCase(),
        limit: 10,
        type: ParseUserType.customer,
        orderBy: 'asc',
        orderByField: 'name',
      };

      const { users } = await this.userService.find(params);
      this.users = users;

    } else {
      this.users = [];
    }

    this.changeDetectorRef.markForCheck();

  }

  async onSearchPlaces(query: string): Promise<void> {

    if (query) {

      const params: PlaceQueryParams = {
        query: query.toLowerCase(),
        limit: 10,
        sort: {
          field: 'title',
          direction: 'asc',
        }
      };

      const { results } = await this.placeService.find(params);
      this.places = results;

    } else {
      this.places = [];
    }

    this.changeDetectorRef.markForCheck();

  }

  onUserSelected(event: MatAutocompleteSelectedEvent) {
    const user = event.option.value as ParseUser;

    if (user) {
      this.reviewQueryParams.user = user.toPointer();
      this.paginator.firstPage();
      this.loadReviews();
    }
  }

  onPlaceSelected(event: MatAutocompleteSelectedEvent) {
    const place = event.option.value as Place;

    if (place) {
      this.reviewQueryParams.place = place.toPointer();
      this.paginator.firstPage();
      this.loadReviews();
    }
  }

  displayUserWith(value: any): string {
    return value?.description;
  }

  displayPlaceWith(value: any): string {
    return value?.title;
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
