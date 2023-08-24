import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { Category } from 'app/modules/admin/category/category.model';
import { CategoryListComponent } from 'app/modules/admin/category/list/list.component';
import { CategoryService } from 'app/modules/admin/category/category.service';
import { Status } from 'app/core/enum/status.enum';
import { FileService } from 'app/core/file/file.service';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';

@Component({
  selector: 'app-category-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class CategoryDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('titleField') private titleField: ElementRef;
  @ViewChild('imageFileInput') private imageFileInput: ElementRef;

  public category: Category;
  public form: FormGroup;
  public categories: Category[];
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public statusOpts = [Status.inactive, Status.active];

  public isSavingOrDeleting: boolean;

  public alert: { type?: FuseAlertType; message?: string } = {};

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fuseConfirmationService: FuseConfirmationService,
    private categoryListComponent: CategoryListComponent,
    private categoryService: CategoryService,
    private fileService: FileService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.categoryListComponent.matDrawer.open();
    this.setupForm();
    this.setupEvents();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
    this.categoryListComponent.matDrawer.close();
  }

  ngAfterViewInit(): void {
    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadCategory(id);
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
      title: ['', [Validators.required]],
      status: ['', [Validators.required]],
      order: ['', [Validators.required]],
      image: [null],
      isFeatured: [false],
    }, { updateOn: 'change' });
  }

  setupEvents(): void {
    this.router.events
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const id = this.getParams().id;
        this.loadCategory(id);
      });
  }

  async onUploadFeaturedImage(fileList: FileList): Promise<void> {

    if (!fileList.length) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png'];
    const file = fileList[0];

    if (!allowedTypes.includes(file.type)) {
      return;
    }

    const imageFormControl = this.form.get('image');

    const isBase64 = false;
    const savedFile = await this.fileService.upload(file, file.name, isBase64);
    imageFormControl.setValue(savedFile);
    this.changeDetectorRef.markForCheck();
  }

  onRemoveFeaturedImage(): void {

    const imageFormControl = this.form.get('image');
    imageFormControl.setValue(null);

    this.imageFileInput.nativeElement.value = null;
  }

  async loadCategory(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.category = await this.categoryService.findOne(id);

      this.form.patchValue({
        title: this.category.title,
        order: this.category.order,
        status: this.category.status,
        isFeatured: this.category.isFeatured,
        image: this.category.image,
      });

      this.titleField?.nativeElement.focus();

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

          await this.category.save({ deletedAt: new Date });
          this.categoryService.onCategoryDestroyed(this.category);

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
        this.category = new Category;
      }

      await this.category.save(formData);

      if (this.mode === this.ViewMode.CREATE) {
        this.categoryService.onCategoryCreated(this.category);
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

