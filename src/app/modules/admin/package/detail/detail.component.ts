import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { Package } from 'app/modules/admin/package/package.model';
import { PackageListComponent } from 'app/modules/admin/package/list/list.component';
import { PackageService } from 'app/modules/admin/package/package.service';
import { Status } from 'app/core/enum/status.enum';
import { FileService } from 'app/core/file/file.service';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';

@Component({
  selector: 'app-package-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class PackageDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('nameField') private nameField: ElementRef;
  @ViewChild('imageFileInput') private imageFileInput: ElementRef;

  public package: Package;
  public form: FormGroup;
  public packages: Package[];
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public statusOpts = [Status.inactive, Status.active];

  public isSavingOrDeleting: boolean;

  public alert: { type?: FuseAlertType; message?: string } = {};

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fuseConfirmationService: FuseConfirmationService,
    private packageListComponent: PackageListComponent,
    private packageService: PackageService,
    private fileService: FileService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.packageListComponent.matDrawer.open();
    this.setupForm();
    this.setupEvents();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
    this.packageListComponent.matDrawer.close();
  }

  ngAfterViewInit(): void {
    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadPackage(id);
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
      type: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],
      sort: [null, [Validators.required]],
      price: [null, [Validators.required]],
      salePrice: [null],
      status: ['', [Validators.required]],
      listingDuration: [null],
      listingLimit: [null],
      markListingAsFeatured: [false],
      autoApproveListing: [false],
      disableMultiplePurchases: [false],
    }, { updateOn: 'change' });
  }

  setupEvents(): void {
    this.router.events
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const id = this.getParams().id;
        this.loadPackage(id);
      });

      this.form.get('type').valueChanges.pipe(
        takeUntil(this.unsubscribeAll),
      ).subscribe(value => {

        const listingLimitControl = this.form.get('listingLimit');
        const markListingAsFeaturedControl = this.form.get('markListingAsFeatured');
        const autoApproveListingControl = this.form.get('autoApproveListing');
        const disableMultiplePurchasesControl = this.form.get('disableMultiplePurchases');

        if (value === 'paid_listing') {

          listingLimitControl.setValue(null);
          listingLimitControl.enable();
          markListingAsFeaturedControl.enable();
          autoApproveListingControl.enable();
          disableMultiplePurchasesControl.enable();

        } else if (value === 'promote_listing') {

          listingLimitControl.setValue(1);
          listingLimitControl.disable();
          markListingAsFeaturedControl.setValue(false);
          markListingAsFeaturedControl.disable();

          autoApproveListingControl.setValue(false);
          autoApproveListingControl.disable();

          disableMultiplePurchasesControl.setValue(false);
          disableMultiplePurchasesControl.disable();
        }

        listingLimitControl.updateValueAndValidity();
        markListingAsFeaturedControl.updateValueAndValidity();
        autoApproveListingControl.updateValueAndValidity();
        disableMultiplePurchasesControl.updateValueAndValidity();
      
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

  async loadPackage(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.package = await this.packageService.findOne(id);

      this.form.patchValue({
        type: this.package.type,
        name: this.package.name,
        description: this.package.description,
        sort: this.package.sort,
        price: this.package.price,
        salePrice: this.package.salePrice,
        status: this.package.status,
        listingDuration: this.package.listingDuration,
        listingLimit: this.package.listingLimit,
        markListingAsFeatured: this.package.markListingAsFeatured,
        autoApproveListing: this.package.autoApproveListing,
        disableMultiplePurchases: this.package.disableMultiplePurchases,
      });

      this.nameField?.nativeElement.focus();

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

          await this.package.save({ deletedAt: new Date });
          this.packageService.onPackageDestroyed(this.package);

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
        this.package = new Package;
      }

      await this.package.save(formData);

      if (this.mode === this.ViewMode.CREATE) {
        this.packageService.onPackageCreated(this.package);
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

