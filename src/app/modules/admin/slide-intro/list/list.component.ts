import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { SlideIntro } from 'app/modules/admin/slide-intro/slide-intro.model';
import { SlideIntroService } from 'app/modules/admin/slide-intro/slide-intro.service';
import { Status } from 'app/core/enum/status.enum';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { FuseAlertType } from '@fuse/components/alert';
import { Pagination } from 'app/core/interface/pagination.interface';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { ParseUserService } from 'app/core/user/parse-user.service';

@Component({
  selector: 'app-slide-intro-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideIntroListComponent extends BaseComponent implements OnInit, OnDestroy {

  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;

  public drawerMode: 'side' | 'over';
  public slideIntros: SlideIntro[] = [];
  public slideIntroCount: number;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public pagination: Pagination = {
    length: 0,
    page: 0,
    size: this.pageSize,
  };

  public queryParams: ParseQueryParams = {
    page: 1,
    limit: this.pageSize,
  };

  public alert: { type?: FuseAlertType; message?: string } = {};

  public Status = Status;

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: any,
    private slideIntroService: SlideIntroService,
    private userService: ParseUserService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupEvents();
    this.loadSlidesIntro();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupEvents(): void {

    // Listen for new records
    this.slideIntroService.slideIntroCreated$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(slideIntro => {
        this.slideIntros = [slideIntro, ...this.slideIntros];
        this.slideIntroCount++;
        this.pagination.length = this.slideIntroCount;

        if (this.slideIntros.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

        this.changeDetectorRef.markForCheck();
      });

    // Listen for deleted records
    this.slideIntroService.slideIntroDestroyed$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(slideIntro => {
        this.slideIntros = this.slideIntros.filter(c => c.id !== slideIntro.id);
        this.slideIntroCount--;
        this.pagination.length = this.slideIntroCount;

        if (this.slideIntros.length) {
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
    this.queryParams.sort = {
      field: sortState.active,
      direction: sortState.direction,
    };
    this.loadSlidesIntro();
  }

  onPageChanged(event: PageEvent): void {
    this.queryParams.page = event.pageIndex + 1;
    this.queryParams.limit = event.pageSize;
    this.loadSlidesIntro();
  }

  async loadSlidesIntro() {
    try {
      this.showLoadingView();
      this.changeDetectorRef.markForCheck();
      const { results, count } = await this.slideIntroService.find(this.queryParams);
      this.slideIntros = results;
      this.slideIntroCount = count;
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
