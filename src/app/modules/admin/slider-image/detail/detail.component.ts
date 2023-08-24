import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { SliderImage } from 'app/modules/admin/slider-image/slider-image.model';
import { SliderImageListComponent } from 'app/modules/admin/slider-image/list/list.component';
import { SliderImageService } from 'app/modules/admin/slider-image/slider-image.service';
import { Status } from 'app/core/enum/status.enum';
import { FileService } from 'app/core/file/file.service';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { Category } from '../../category/category.model';
import { Post } from '../../post/post.model';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CategoryService } from '../../category/category.service';
import { PostService } from '../../post/post.service';
import { MatchValidator } from 'app/core/validator/match.validator';
import { Place } from '../../place/place.model';
import { PlaceService } from '../../place/place.service';

@Component({
  selector: 'app-slider-image-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class SliderImageDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('imageFileInput') private imageFileInput: ElementRef;

  public sliderImage: SliderImage;
  public categories: Category[] = [];
  public posts: Post[] = [];
  public places: Place[] = [];
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
    private sliderImageListComponent: SliderImageListComponent,
    private sliderImageService: SliderImageService,
    private fileService: FileService,
    private categoryService: CategoryService,
    private postService: PostService,
    private placeService: PlaceService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.sliderImageListComponent.matDrawer.open();
    this.setupForm();
    this.setupEvents();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
    this.sliderImageListComponent.matDrawer.close();
  }

  ngAfterViewInit(): void {
    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadSliderImage(id);
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
      description: [null, Validators.required],
      sort: ['', [Validators.required]],
      position: ['', [Validators.required]],
      page: ['', [Validators.required]],
      type: ['', [Validators.required]],
      image: [null],
      isActive: [false],
      place: [null, [MatchValidator]],
      post: [null, [MatchValidator]],
      category: [null, [MatchValidator]],
      url: [''],
    }, { updateOn: 'change' });
  }

  setupEvents(): void {

    this.router.events
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const id = this.getParams().id;
        this.loadSliderImage(id);
      });

    this.form.get('category').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(value => {
      if (typeof value === 'string' && value.length === 0) {
        this.form.controls.category.setValue(null, {
          emitEvent: false
        });
      }
    });

    this.form.get('post').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(value => {
      if (typeof value === 'string' && value.length === 0) {
        this.form.controls.post.setValue(null, {
          emitEvent: false
        });
      }
    });

    this.form.get('place').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(value => {
      if (typeof value === 'string' && value.length === 0) {
        this.form.controls.place.setValue(null, {
          emitEvent: false
        });
      }
    });

    this.form.get('type').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(() => {

      this.categories = [];
      this.posts = [];
      this.form.controls.category.setValue(null, {
        emitEvent: false
      });
      this.form.controls.place.setValue(null, {
        emitEvent: false
      });
      this.form.controls.post.setValue(null, {
        emitEvent: false
      });
      this.form.controls.url.setValue(null, {
        emitEvent: false
      });

      this.changeDetectorRef.markForCheck();
    });
  }

  async onSearchCategory(event: Event): Promise<void> {

    const query = event.target['value'].trim();

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
    this.form.controls.category.setValue(event.option.value);
  }

  async onSearchPost(event: Event): Promise<void> {

    const query = event.target['value'].trim();

    if (query) {

      const params: ParseQueryParams = {
        query: query,
        limit: 10,
        sort: {
          field: 'title',
          direction: 'asc',
        }
      };

      const { results } = await this.postService.find(params);
      this.posts = results;
     
    } else {
      this.posts = [];
    }

    this.changeDetectorRef.markForCheck();

  }

  onPostSelected(event: MatAutocompleteSelectedEvent) {
    this.form.controls.post.setValue(event.option.value);
  }

  async onSearchPlace(event: Event): Promise<void> {

    const query = event.target['value'].trim();

    if (query) {

      const params: ParseQueryParams = {
        query: query,
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

  onPlaceSelected(event: MatAutocompleteSelectedEvent) {
    this.form.controls.place.setValue(event.option.value);
  }

  displayCategoryWith(value: any): string {
    return value?.title;
  }

  displayPostWith(value: any): string {
    return value?.title;
  }

  displayPlaceWith(value: any): string {
    return value?.title;
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

  async loadSliderImage(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.sliderImage = await this.sliderImageService.findOne(id);

      this.form.patchValue({
        description: this.sliderImage.description,
        sort: this.sliderImage.sort,
        image: this.sliderImage.image,
        isActive: this.sliderImage.isActive,
        position: this.sliderImage.position,
        page: this.sliderImage.page,
        type: this.sliderImage.type,
        place: this.sliderImage.place,
        post: this.sliderImage.post,
        category: this.sliderImage.category,
        url: this.sliderImage.url,
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

          await this.sliderImage.destroy();
          this.sliderImageService.onSliderImageDestroyed(this.sliderImage);

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
        this.sliderImage = new SliderImage;
      }

      await this.sliderImage.save(formData);

      if (this.mode === this.ViewMode.CREATE) {
        this.sliderImageService.onSliderImageCreated(this.sliderImage);
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

