import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { Post } from 'app/modules/admin/post/post.model';
import { PostListComponent } from 'app/modules/admin/post/list/list.component';
import { PostService } from 'app/modules/admin/post/post.service';
import { Status } from 'app/core/enum/status.enum';
import { FileService } from 'app/core/file/file.service';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { Place } from '../../place/place.model';
import { PlaceService } from '../../place/place.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { MatchValidator } from 'app/core/validator/match.validator';

@Component({
  selector: 'app-post-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class PostDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('titleField') private titleField: ElementRef;
  @ViewChild('imageFileInput') private imageFileInput: ElementRef;

  public post: Post;
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
    private postListComponent: PostListComponent,
    private postService: PostService,
    private fileService: FileService,
    private placeService: PlaceService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.postListComponent.matDrawer.open();
    this.setupForm();
    this.setupEvents();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
    this.postListComponent.matDrawer.close();
  }

  ngAfterViewInit(): void {
    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadPost(id);
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
      body: ['', [Validators.required]],
      htmlBody: [''],
      place: [null, [MatchValidator]],
      status: ['', [Validators.required]],
      image: [null],
      isPushEnabled: [false],
    }, { updateOn: 'change' });
  }

  setupEvents(): void {

    this.router.events
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const id = this.getParams().id;
        this.loadPost(id);
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

  async loadPost(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.post = await this.postService.findOne(id);

      this.form.patchValue({
        title: this.post.title,
        body: this.post.body,
        htmlBody: this.post.htmlBody,
        place: this.post.place,
        status: this.post.status,
        isPushEnabled: this.post.isPushEnabled,
        image: this.post.image,
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

          await this.post.destroy();
          this.postService.onPostDestroyed(this.post);

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
        this.post = new Post;
      }

      await this.post.save(formData);

      if (this.mode === this.ViewMode.CREATE) {
        this.postService.onPostCreated(this.post);
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

