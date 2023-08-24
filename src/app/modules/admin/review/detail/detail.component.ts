import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { Review } from 'app/modules/admin/review/review.model';
import { ReviewListComponent } from 'app/modules/admin/review/list/list.component';
import { ReviewService } from 'app/modules/admin/review/review.service';
import { Status } from 'app/core/enum/status.enum';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';

@Component({
  selector: 'app-review-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class ReviewDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  public review: Review;
  public form: FormGroup;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public statusOpts = [Status.pending, Status.banned, Status.published];

  public isSavingOrDeleting: boolean;

  public alert: { type?: FuseAlertType; message?: string } = {};

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fuseConfirmationService: FuseConfirmationService,
    private reviewListComponent: ReviewListComponent,
    private reviewService: ReviewService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.reviewListComponent.matDrawer.open();
    this.setupForm();
    this.setupEvents();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
    this.reviewListComponent.matDrawer.close();
  }

  ngAfterViewInit(): void {
    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadReview(id);
    } else {
      this.mode = this.ViewMode.CREATE;
      this.showContentView();
    }
  }

  onCancel(): void {
    this.navigateToRelative('../');
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      status: ['', [Validators.required]],
    }, { updateOn: 'change' });
  }

  setupEvents(): void {
    this.router.events
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const id = this.getParams().id;
        this.loadReview(id);
      });
  }

  async loadReview(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.review = await this.reviewService.findOne(id);

      this.form.patchValue({
        status: this.review.status,
      });

      this.showContentView();

    } catch (error) {

      if (error.code === 101) {
        this.showEmptyView();
      } else {
        this.showErrorView();
      }

    } finally {
      this.changeDetectorRef.markForCheck();
    }
  }

  onDeleteButtonClicked(): void {

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
          this.isSavingOrDeleting = true;
          this.changeDetectorRef.markForCheck();

          await this.review.destroy();
          this.reviewService.onReviewDestroyed(this.review);

          const transValue = this.getTrans('DELETED');

          this.alert.message = transValue;
          this.alert.type = 'warning';
          this.changeDetectorRef.markForCheck();

          await Utils.sleep(1500);

          this.navigateToRelative('../');

        } catch (error) {
          const transValue = this.getTrans('ERROR_NETWORK');
          this.alert.message = transValue;
          this.alert.type = 'error';
        } finally {
          this.isSavingOrDeleting = false;
          this.changeDetectorRef.markForCheck();
        }

      }
    });
  }

  async onSaveButtonClicked(): Promise<void> {

    if (this.form.invalid) {
      return;
    }

    try {
      const formData = this.form.getRawValue();

      this.alert.message = null;
      this.isSavingOrDeleting = true;

      if (this.mode === this.ViewMode.CREATE) {
        this.review = new Review;
      }

      await this.review.save(formData);

      if (this.mode === this.ViewMode.CREATE) {
        this.reviewService.onReviewCreated(this.review);
      }

      const transValue = this.getTrans('CHANGES_SAVED');

      this.alert.message = transValue;
      this.alert.type = 'success';

      this.changeDetectorRef.markForCheck();

      await Utils.sleep(1500);

      this.navigateToRelative('../');

    } catch (error) {
      const transValue = this.getTrans('ERROR_NETWORK');
      this.alert.message = transValue;
      this.alert.type = 'error';
    } finally {
      this.isSavingOrDeleting = false;
      this.changeDetectorRef.markForCheck();
    }
  }
}

