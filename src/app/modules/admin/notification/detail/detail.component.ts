import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { Notification } from 'app/modules/admin/notification/notification.model';
import { NotificationListComponent } from 'app/modules/admin/notification/list/list.component';
import { NotificationService } from 'app/modules/admin/notification/notification.service';
import { Status } from 'app/core/enum/status.enum';
import { FileService } from 'app/core/file/file.service';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { GoogleMap, MapCircle, MapMarker } from '@angular/google-maps';
import { Loader } from "@googlemaps/js-api-loader"
import { environment } from 'environments/environment';
import { ParseUser, ParseUserQueryParams, ParseUserType } from 'app/core/user/parse-user.model';
import { ParseUserService } from 'app/core/user/parse-user.service';
import { CategoryService } from '../../category/category.service';
import { PlaceService } from '../../place/place.service';
import { PostService } from '../../post/post.service';
import { Place } from '../../place/place.model';
import { Category } from '../../category/category.model';
import { Post } from '../../post/post.model';
import { MatchValidator } from 'app/core/validator/match.validator';

@Component({
  selector: 'app-notification-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class NotificationDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;
  @ViewChild(MapMarker, { static: false }) mapMarker: MapMarker;
  @ViewChild(MapCircle, { static: false }) mapCircle: MapCircle;
  @ViewChild('titleField') private titleField: ElementRef;
  @ViewChild('imageFileInput') private imageFileInput: ElementRef;
  @ViewChild('userInput') userInput: ElementRef<HTMLInputElement>;

  public readonly separatorKeysCodes = [ENTER, COMMA] as const;

  public notification: Notification;
  public places: Place[] = [];
  public categories: Category[] = [];
  public posts: Post[] = [];
  public users: ParseUser[] = [];
  public form: FormGroup;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  public statusOpts = [
    Status.pending,
    Status.pending_approval,
    Status.approved,
    Status.rejected,
    Status.expired,
  ];

  public isSavingOrDeleting: boolean;

  public alert: { type?: FuseAlertType; message?: string } = {};

  public quillModules: any = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ align: [] }, { list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  public mapOptions: google.maps.MapOptions = {
    center: { lat: 0, lng: 0 },
    minZoom: 2,
    maxZoom: 16,
    zoom: 2,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    scrollwheel: false,
  };
  public isGoogleMapsLoaded: boolean;

  public googleSuggestions: any;

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fuseConfirmationService: FuseConfirmationService,
    private placeListComponent: NotificationListComponent,
    private notificationService: NotificationService,
    private fileService: FileService,
    private userService: ParseUserService,
    private postService: PostService,
    private categoryService: CategoryService,
    private placeService: PlaceService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.placeListComponent.matDrawer.open();
    this.setupForm();
    this.setupEvents();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
    this.placeListComponent.matDrawer.close();
  }

  ngAfterViewInit(): void {

    this.loadGoogleMaps();

    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadNotification(id);
    } else {
      this.mode = this.ViewMode.CREATE;
      this.showContentView();
    }
  }

  onCancel(): void {
    this.navigateToRelative('../');
  }

  async loadGoogleMaps(): Promise<void> {

    const loader = new Loader({
      apiKey: environment.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places'],
      language: this.getDefaultLang(),
    });

    await loader.load();

    this.isGoogleMapsLoaded = true;

    this.changeDetectorRef.markForCheck();
  }

  onMapCenterChanged() {
    const center = this.map.getCenter();
    this.mapMarker.marker.setPosition(center);
    this.mapCircle.center = center;

    this.form.controls.latitude.setValue(center.lat());
    this.form.controls.longitude.setValue(center.lng());
  }

  onSearchAddress(event: any): void {

    const input = event.target['value'].trim();

    if (input) {

      const autocompleteService = new google.maps.places.AutocompleteService;

      autocompleteService.getPlacePredictions(
        { input },
        (res: google.maps.places.AutocompletePrediction[]) => {
          this.googleSuggestions = res;
        });
    } else {
      this.googleSuggestions = [];
    }
  }

  onGoogleSuggestionSelected(event: MatAutocompleteSelectedEvent): void {

    const suggestion: google.maps.places.AutocompletePrediction = event.option.value;

    if (suggestion) {

      const placesService = new google.maps.places.PlacesService(this.map.googleMap);

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: suggestion.place_id,
      };

      placesService.getDetails(request, (result: google.maps.places.PlaceResult) => {

        const location = result.geometry.location;

        this.form.get('radius').setValue(5000);

        this.map.panTo(location);
        this.map.googleMap.setZoom(11);
      });
    }
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      title: ['', [Validators.required]],
      message: ['', [Validators.required]],
      type: ['Geo', [Validators.required]],
      users: [[]],
      place: [null, [MatchValidator]],
      post: [null, [MatchValidator]],
      category: [null, [MatchValidator]],
      address: [''],
      attachmentType: [''],
      radius: [null, [Validators.required]],
      latitude: [null, [Validators.required]],
      longitude: [null, [Validators.required]],
      image: [null],
    }, { updateOn: 'change' });
  }

  setupEvents(): void {

    this.router.events
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const id = this.getParams().id;
        this.loadNotification(id);
      });

    this.form.get('type').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(value => {

      const radiusFormControl = this.form.get('radius');
      const latitudeFormControl = this.form.get('latitude');
      const longitudeFormControl = this.form.get('longitude');
      const addressFormControl = this.form.get('address');

      if (value === 'Geo') {

        radiusFormControl.setValidators([Validators.required]);
        latitudeFormControl.setValidators([Validators.required]);
        longitudeFormControl.setValidators([Validators.required]);

      } else {

        radiusFormControl.clearValidators();
        latitudeFormControl.clearValidators();
        longitudeFormControl.clearValidators();
      }

      radiusFormControl.setValue(null);
      radiusFormControl.updateValueAndValidity();

      latitudeFormControl.setValue(null);
      latitudeFormControl.updateValueAndValidity();

      longitudeFormControl.setValue(null);
      longitudeFormControl.updateValueAndValidity();

      addressFormControl.setValue(null);
      addressFormControl.updateValueAndValidity();
    });

    this.form.get('radius').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(value => {
      this.mapCircle.radius = value;
    });

    this.form.get('users').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(value => {
      if (typeof value === 'string' && value.length === 0) {
        this.form.controls.users.setValue(null, {
          emitEvent: false
        });
      }
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

    this.form.get('attachmentType').valueChanges.pipe(
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

      this.changeDetectorRef.markForCheck();
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
        },
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

  async onSearchCategory(event: Event): Promise<void> {

    const query = event.target['value'].trim();

    if (query) {

      const params: ParseQueryParams = {
        query: query,
        limit: 10,
        sort: {
          field: 'title',
          direction: 'asc',
        },
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
        },
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

  displayPlaceWith(value: any): string {
    return value?.title;
  }

  displayCategoryWith(value: any): string {
    return value?.title;
  }

  displayPostWith(value: any): string {
    return value?.title;
  }

  onUserSelected(event: MatAutocompleteSelectedEvent) {

    const value = event.option.value;

    if (value) {
      this.form.controls.users.setValue([
        ...this.form.controls.users.value,
        value,
      ]);
      this.form.controls.users.updateValueAndValidity();

      this.userInput.nativeElement.value = '';
    }
  }

  onUserRemoved(user: ParseUser): void {
    const filteredUsers = this.form.controls.users.value
      .filter((c: ParseUser) => c.id !== user.id);

    this.form.controls.users.setValue(filteredUsers);
    this.form.controls.users.updateValueAndValidity();
  }

  async onSearchUser(event: Event): Promise<void> {

    const query = event.target['value'].trim();

    const ids = this.form.get('users').value.map((c: ParseUser) => c.id);

    if (query) {

      const params: ParseUserQueryParams = {
        canonical: query.toLowerCase(),
        limit: 10,
        exclude: ids,
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

  displayUserWith(value: any): string {
    return value?.description;
  }

  displayGoogleSuggestionWith(value: any): string {
    return value?.description;
  }

  async onUploadImage(fileList: FileList): Promise<void> {

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

  onRemoveImage(): void {

    const imageFormControl = this.form.get('image');
    imageFormControl.setValue(null);

    this.imageFileInput.nativeElement.value = null;
  }

  async loadNotification(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.notification = await this.notificationService.findOne(id);

      this.form.patchValue({
        title: this.notification.title,
        message: this.notification.message,
        type: this.notification.type,
        radius: this.notification.radius,
        latitude: this.notification.latitude,
        longitude: this.notification.longitude,
        attachmentType: this.notification.attachmentType,
        users: this.notification.users,
        place: this.notification.place,
        category: this.notification.category,
        post: this.notification.post,
        address: this.notification.address,
        image: this.notification.image,
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

          await this.notification.destroy();
          this.notificationService.onNotificationDestroyed(this.notification);

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

      if (formData.type === 'Geo') {
        formData.address = formData.address?.description;
        formData.bounds = this.mapCircle.getBounds().toJSON();
      }

      this.alert.message = null;
      this.isSavingOrDeleting = true;

      if (this.mode === this.ViewMode.CREATE) {
        this.notification = new Notification;
      }

      await this.notification.save(formData);

      if (this.mode === this.ViewMode.CREATE) {
        this.notificationService.onNotificationCreated(this.notification);
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

