import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { debounceTime, filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { UserPackage } from 'app/modules/admin/user-package/user-package.model';
import { UserPackageService } from 'app/modules/admin/user-package/user-package.service';
import { Status } from 'app/core/enum/status.enum';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { FuseAlertType } from '@fuse/components/alert';
import { Pagination } from 'app/core/interface/pagination.interface';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { fuseAnimations } from '@fuse/animations';
import { ParseUserService } from 'app/core/user/parse-user.service';
import { ParseUser, ParseUserQueryParams, ParseUserType } from 'app/core/user/parse-user.model';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-user-package-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class UserPackageListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  public drawerMode: 'side' | 'over';
  public userPackages: UserPackage[] = [];
  public users: ParseUser[] = [];
  public userPackageCount: number;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public filterStatusSelectControl: FormControl = new FormControl();
  public filterUserAutocompleteControl: FormControl = new FormControl();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public userPackageQueryParams: ParseQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  public statusOpts = [
    Status.unpaid,
    Status.paid,
  ];

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private userPackageService: UserPackageService,
    private userService: ParseUserService,
    private fuseConfirmationService: FuseConfirmationService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.loadUserPackages();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.userPackageService.userPackageCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(userPackageModel => {
        this.userPackages = [userPackageModel, ...this.userPackages];
        this.userPackageCount++;
        this.pagination.length = this.userPackageCount;

        if (this.userPackages.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.userPackageService.userPackageDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(userPackageModel => {
        this.userPackages = this.userPackages.filter(c => c.id !== userPackageModel.id);
        this.userPackageCount--;
        this.pagination.length = this.userPackageCount;

        if (this.userPackages.length) {
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
          this.userPackageQueryParams.status = query;
          this.paginator.firstPage();
          return this.loadUserPackages();
        })
      ).subscribe();

    this.filterUserAutocompleteControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll),
        debounceTime(300),
        switchMap(query => {
          if (typeof query === 'string') {

            if (query.length === 0) {
              this.userPackageQueryParams.user = null;
              this.paginator.firstPage();
              this.loadUserPackages();
            }

            return this.onSearchUsers(query);
          }
          return new Observable;
        })
      ).subscribe();
  }

  onSortChanged(sortState: Sort): void {
    this.userPackageQueryParams.sort = {
      field: sortState.active,
      direction: sortState.direction,
    };
    this.loadUserPackages();
  }

  onPageChanged(event: PageEvent): void {
    this.userPackageQueryParams.page = event.pageIndex + 1;
    this.userPackageQueryParams.limit = event.pageSize;
    this.loadUserPackages();
  }

  async loadUserPackages() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { results, count } = await this.userPackageService.find(this.userPackageQueryParams);
      this.userPackages = results;
      this.userPackageCount = count;
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

  onDeleteButtonClicked(userPackage: UserPackage): void {

    const transValues = this.getTrans([
      'DELETE', 'CONFIRM_DELETE', 'CANCEL',
    ]);

    const confirmation = this.fuseConfirmationService.open({
      title: transValues[0],
      message: transValues[1],
      actions: {
        cancel: {
          label: transValues[2],
        },
        confirm: {
          label: transValues[0],
        }
      }
    });

    confirmation.afterClosed().subscribe(async result => {

      if (result === 'confirmed') {

        try {

          this.alert.message = null;
          this.changeDetectorRef.markForCheck();

          await userPackage.save({ deletedAt: new Date });

          this.userPackages = this.userPackages.filter(c => c.id !== userPackage.id);

          this.userPackageCount--;
          this.pagination.length = this.userPackageCount;

          const transValue = this.getTrans('DELETED');

          this.alert.message = transValue;
          this.alert.type = 'warning';
          this.changeDetectorRef.markForCheck();

        } catch {
          const transValue = this.getTrans('ERROR_NETWORK');
          this.alert.message = transValue;
          this.alert.type = 'error';
        } finally {
          this.changeDetectorRef.markForCheck();

          setTimeout(() => {
            this.alert.message = null;
            this.changeDetectorRef.markForCheck();
          }, 3000);
        }

      }
    });
  }

  onCreateButtonClicked() {
    this.navigateToRelative('./new');
    this.changeDetectorRef.markForCheck();
  }

  onBackdropClicked(): void {
    this.navigateToRelative('./');
    this.changeDetectorRef.markForCheck();
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

  onUserSelected(event: MatAutocompleteSelectedEvent) {

    const user = event.option.value as ParseUser;

    if (user) {
      this.userPackageQueryParams.user = user.toPointer();
      this.paginator.firstPage();
      this.loadUserPackages();
    }

  }

  displayUserWith(value: any): string {
    return value?.description;
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
