import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Notification } from 'app/modules/admin/notification/notification.model';
import { NotificationService } from 'app/modules/admin/notification/notification.service';
import { Status } from 'app/core/enum/status.enum';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { FuseAlertType } from '@fuse/components/alert';
import { Pagination } from 'app/core/interface/pagination.interface';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { ParseUserService } from 'app/core/user/parse-user.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { fuseAnimations } from '@fuse/animations';

@Component({
  selector: 'app-notification-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class NotificationListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  public drawerMode: 'side' | 'over';
  public notifications: Notification[] = [];
  public notificationCount: number;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public placeQueryParams: ParseQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private notificationService: NotificationService,
    private userService: ParseUserService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
    private fuseConfirmationService: FuseConfirmationService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.notificationService.notificationCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(notification => {
        this.notifications = [notification, ...this.notifications];
        this.notificationCount++;
        this.pagination.length = this.notificationCount;

        if (this.notifications.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.notificationService.notificationDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(notification => {
        this.notifications = this.notifications.filter(c => c.id !== notification.id);
        this.notificationCount--;
        this.pagination.length = this.notificationCount;

        if (this.notifications.length) {
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
  }

  onSortChanged(sortState: Sort): void {
    this.placeQueryParams.sort = {
      field: sortState.active,
      direction: sortState.direction,
    };
    this.loadNotifications();
  }

  onPageChanged(event: PageEvent): void {
    this.placeQueryParams.page = event.pageIndex + 1;
    this.placeQueryParams.limit = event.pageSize;
    this.loadNotifications();
  }

  async loadNotifications() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { results, count } = await this.notificationService.find(this.placeQueryParams);
      this.notifications = results;
      this.notificationCount = count;
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

  onDeleteButtonClicked(notification: Notification): void {

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

          await notification.save({ deletedAt: new Date });

          this.notifications = this.notifications.filter(c => c.id !== notification.id);

          this.notificationCount--;
          this.pagination.length = this.notificationCount;

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

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
