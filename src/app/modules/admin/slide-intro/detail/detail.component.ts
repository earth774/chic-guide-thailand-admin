import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { SlideIntro } from 'app/modules/admin/slide-intro/slide-intro.model';
import { SlideIntroListComponent } from 'app/modules/admin/slide-intro/list/list.component';
import { SlideIntroService } from 'app/modules/admin/slide-intro/slide-intro.service';
import { Status } from 'app/core/enum/status.enum';
import { FileService } from 'app/core/file/file.service';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';

@Component({
  selector: 'app-slide-intro-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class SlideIntroDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('titleField') private titleField: ElementRef;
  @ViewChild('imageFileInput') private imageFileInput: ElementRef;

  public slideIntro: SlideIntro;
  public form: FormGroup;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public statusOpts = [Status.pending, Status.active];
  public isSavingOrDeleting: boolean;
  public alert: { type?: FuseAlertType; message?: string } = {};

  public quillModules: any = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ align: [] }, { list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fuseConfirmationService: FuseConfirmationService,
    private slideIntroListComponent: SlideIntroListComponent,
    private slideIntroService: SlideIntroService,
    private fileService: FileService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.slideIntroListComponent.matDrawer.open();
    this.setupForm();
    this.setupEvents();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
    this.slideIntroListComponent.matDrawer.close();
  }

  ngAfterViewInit(): void {
    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadSlideIntro(id);
    } else {
      this.mode = this.ViewMode.CREATE;
      this.showContentView();
      this.changeDetectorRef.markForCheck();
    }
    
  }

  onCancel(): void {
    this.navigateToRelative('../');
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      title: ['', [Validators.required]],
      text: [''],
      sort: ['', [Validators.required]],
      image: [null],
      isActive: [false],
      permission: ['none', [Validators.required]],
    }, { updateOn: 'change' });
  }

  setupEvents(): void {

    this.router.events
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const id = this.getParams().id;
        this.loadSlideIntro(id);
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

  async loadSlideIntro(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.slideIntro = await this.slideIntroService.findOne(id);

      this.form.patchValue({
        title: this.slideIntro.title,
        text: this.slideIntro.text,
        sort: this.slideIntro.sort,
        image: this.slideIntro.image,
        permission: this.slideIntro.permission,
        isActive: this.slideIntro.isActive,
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

          await this.slideIntro.destroy();
          this.slideIntroService.onSlideIntroDestroyed(this.slideIntro);

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
        this.slideIntro = new SlideIntro;
      }

      await this.slideIntro.save(formData);

      if (this.mode === this.ViewMode.CREATE) {
        this.slideIntroService.onSlideIntroCreated(this.slideIntro);
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

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}

