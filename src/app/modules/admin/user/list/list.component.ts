import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { debounceTime, filter, fromEvent, Subject, switchMap, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Status } from 'app/core/enum/status.enum';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { FuseAlertType } from '@fuse/components/alert';
import { Pagination } from 'app/core/interface/pagination.interface';
import { ParseUser, ParseUserQueryParams } from 'app/core/user/parse-user.model';
import { ParseUserService } from 'app/core/user/parse-user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  public drawerMode: 'side' | 'over';
  public users: ParseUser[] = [];
  public userCount: number;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public searchInputControl: FormControl = new FormControl();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public userQueryParams: ParseUserQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  public titlePage: string;

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private userService: ParseUserService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.activatedRoute.data.subscribe(data => {

      if (data.type === 'admin') {
        this.titlePage = 'users';
      } else {
        this.titlePage = 'customers';
      }

      this.userQueryParams.type = data.type;
      this.loadUsers();
    });
    
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.userService.userCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(user => {
        this.users = [user, ...this.users];
        this.userCount++;
        this.pagination.length = this.userCount;

        if (this.users.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.userService.userDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(user => {
        this.users = this.users.filter(c => c.id !== user.id);
        this.userCount--;
        this.pagination.length = this.userCount;

        if (this.users.length) {
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
          this.userQueryParams.canonical = query;
          this.paginator.firstPage();
          return this.loadUsers();
        })
      ).subscribe();
  }

  onSortChanged(sortState: Sort): void {
    this.userQueryParams.orderByField = sortState.active;
    this.userQueryParams.orderBy = sortState.direction,
    this.loadUsers();
  }

  onPageChanged(event: PageEvent): void {
    this.userQueryParams.page = event.pageIndex + 1;
    this.userQueryParams.limit = event.pageSize;
    this.loadUsers();
  }

  async loadUsers() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { users, total } = await this.userService.find(this.userQueryParams);
      this.users = users;
      this.userCount = total;
      this.pagination.length = total;

      if (users.length) {
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
