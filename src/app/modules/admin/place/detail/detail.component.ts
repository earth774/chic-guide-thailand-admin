import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { filter, Subject, takeUntil } from 'rxjs';
import { Place } from 'app/modules/admin/place/place.model';
import { PlaceListComponent } from 'app/modules/admin/place/list/list.component';
import { PlaceService } from 'app/modules/admin/place/place.service';
import { Status } from 'app/core/enum/status.enum';
import { FileService } from 'app/core/file/file.service';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { Category } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ParseQueryParams } from 'app/core/interface/query.interface';
import { MatChipInputEvent } from '@angular/material/chips';
import { GoogleMap, MapGeocoder, MapMarker } from '@angular/google-maps';
import { Loader } from "@googlemaps/js-api-loader"
import { environment } from 'environments/environment';
import { ParseUser, ParseUserQueryParams, ParseUserType } from 'app/core/user/parse-user.model';
import { ParseUserService } from 'app/core/user/parse-user.service';
import { FilePondOptions } from 'filepond';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { UserDetailComponent } from '../../user/detail/detail.component';

@Component({
  selector: 'app-place-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class PlaceDetailComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;
  @ViewChild(MapMarker, { static: false }) mapMarker: MapMarker;
  @ViewChild('titleField', { static: false }) private titleField: ElementRef;
  @ViewChild('imageFileInput') private imageFileInput: ElementRef;
  @ViewChild('mapMarkerIconFileInput') private mapMarkerIconFileInput: ElementRef;
  @ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;

  public readonly separatorKeysCodes = [ENTER, COMMA] as const;

  public static guestTranslation: string;

  public place: Place;
  public categories: Category[] = [];
  public users: ParseUser[] = [];
  public images: Parse.File[] = [];
  public googlePhotos: string[] = [];
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

  public pondOptions: FilePondOptions = {
    allowMultiple: true,
    allowDrop: true,
    allowProcess: false,
    allowReorder: false,
    allowRevert: false,
    maxFiles: 10,
    maxParallelUploads: 2,
    acceptedFileTypes: ['image/*'],
    server: {
      process: async (fieldName, file, metadata, load, error, progress, abort) => {

        const isBase64 = false;
        const saveImmediately = false;

        const parseFile = await this.fileService.upload(file, file.name, isBase64, saveImmediately);

        try {
          await parseFile.save({
            progress: (progressValue: number, loaded: number, total: number, { type }) => {
              if (type === 'upload' && progressValue !== null) {
                progress(true, loaded, total);
              }
            }
          });

          this.images = [
            parseFile,
            ...this.images,
          ];

          this.changeDetectorRef.markForCheck();

          load(parseFile.name());

        } catch (parseError) {
          error(parseError.message);
        }

        return {
          // Called if the user has tapped the cancel button
          abort: () => {
            parseFile.cancel();
            // Let FilePond know the request has been cancelled
            abort();
          },
        };

      }
    },
    // @ts-ignore
    credits: {
      label: '',
      url: '',
    },
  }

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

  private googleMapsLoadedSource = new Subject<void>();
  googleMapsLoaded$ = this.googleMapsLoadedSource.asObservable();

  public googleSuggestions: any;

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fuseConfirmationService: FuseConfirmationService,
    private placeListComponent: PlaceListComponent,
    private placeService: PlaceService,
    private fileService: FileService,
    private categoryService: CategoryService,
    private userService: ParseUserService,
    private geocoder: MapGeocoder,
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

    const id = this.getParams().id;

    this.mode = null;

    if (id !== 'new') {
      this.mode = this.ViewMode.UPDATE;
      this.loadPlace(id);
    } else {
      this.mode = this.ViewMode.CREATE;
      this.showContentView();
      this.changeDetectorRef.markForCheck();
      this.loadGoogleMaps();

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
    this.googleMapsLoadedSource.next();
    this.changeDetectorRef.markForCheck();
  }

  onMapCenterChanged() {
    const center = this.map.getCenter();
    this.mapMarker.marker.setPosition(center);

    const request: google.maps.GeocoderRequest = {
      location: center,
    };

    this.geocoder.geocode(request).subscribe(({ results, status }) => {
      if (status === google.maps.GeocoderStatus.OK) {
        const target = results[0];
        this.form.controls.address.setValue(target.formatted_address);
      }
    });
  }

  onSearchAddress(event: any): void {

    const input = event.target['value'].trim();

    if (input) {

      const autocompleteService = new google.maps.places.AutocompleteService;

      autocompleteService.getPlacePredictions(
        { input, types: ['establishment'] },
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

        this.form.controls.title.setValue(result.name);
        this.form.controls.website.setValue(result.website);
        this.form.controls.phone.setValue(result.international_phone_number?.replace(/ /g, ''));

        this.form.controls.address.setValue(result.formatted_address);
        this.form.controls.address.updateValueAndValidity();

        this.googlePhotos = result.photos.map((image) => {
          return image.getUrl({
            maxWidth: 800
          })
        });

        this.map.panTo(location);
        this.map.googleMap.setZoom(15);
      });
    }
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      title: ['', [Validators.required]],
      description: [''],
      longDescription: [''],
      tags: [[]],
      user: [null],
      categories: [[]],
      address: [''],
      phone: [''],
      email: [''],
      whatsapp: [''],
      website: [''],
      youtube: [''],
      facebook: [''],
      instagram: [''],
      status: ['', [Validators.required]],
      priceRange: [null],
      expiresAt: [null],
      image: [null],
      icon: [null],
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
        this.loadPlace(id);
      });

    this.form.get('categories').valueChanges.pipe(
      takeUntil(this.unsubscribeAll),
    ).subscribe(value => {
      if (typeof value === 'string' && value.length === 0) {
        this.form.controls.categories.setValue(null, {
          emitEvent: false
        });
      }
    });

    this.translocoService.selectTranslate([
      'DROP_FILES',
      'UPLOAD_COMPLETE',
      'UPLOAD_FAILED',
      'UPLOADING',
      'TAP_TO_UNDO',
      'TAP_TO_CANCEL',
      'TAP_TO_RETRY',
      'GUEST',
    ]).subscribe(transValues => {
      this.pondOptions = {
        ...this.pondOptions,
        labelIdle: transValues[0],
        labelFileProcessingComplete: transValues[1],
        labelFileProcessingError: transValues[2],
        labelFileProcessing: transValues[3],
        labelTapToUndo: transValues[4],
        labelTapToCancel: transValues[5],
        labelTapToRetry: transValues[6],
      };

      PlaceDetailComponent.guestTranslation = transValues[7];
    });
  }

  onAddTag(event: MatChipInputEvent): void {

    const input = event.chipInput!;
    const value = event.value;

    if ((value || '').trim()) {
      this.form.controls.tags.setValue([
        ...this.form.controls.tags.value,
        value.trim(),
      ]);
      this.form.controls.tags.updateValueAndValidity();
    }

    input.clear();
  }

  onTagRemoved(tag: string): void {
    const index = this.form.controls.tags.value.indexOf(tag);

    if (index >= 0) {
      this.form.controls.tags.value.splice(index, 1);
      this.form.controls.tags.updateValueAndValidity();
    }
  }

  onCategorySelected(event: MatAutocompleteSelectedEvent) {

    const value = event.option.value;

    if (value) {
      this.form.controls.categories.setValue([
        ...this.form.controls.categories.value,
        value,
      ]);
      this.form.controls.categories.updateValueAndValidity();

      this.tagInput.nativeElement.value = '';
    }
  }

  onCategoryRemoved(category: Category): void {
    const filteredCategories = this.form.controls.categories.value
      .filter((c: Category) => c.id !== category.id);

    this.form.controls.categories.setValue(filteredCategories);
    this.form.controls.categories.updateValueAndValidity();
  }

  async onSearchCategory(event: Event): Promise<void> {

    const query = event.target['value'].trim();

    if (query) {

      const ids = this.form.get('categories').value.map((c: Category) => c.id);

      const params: ParseQueryParams = {
        query: query,
        exclude: ids,
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

  async onSearchUser(event: Event): Promise<void> {

    const query = event.target['value'].trim();

    this.changeDetectorRef.markForCheck();

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
    this.form.controls.user.setValue(event.option.value);
  }

  displayCategoryWith(value: any): string {
    return value?.title;
  }

  displayUserWith(value: any): string {
    if (!value) return;
    return value?.description || PlaceDetailComponent.guestTranslation;
  }

  displayGoogleSuggestionWith(value: any): string {
    return value?.description;
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

  async onUploadMapMarkerIcon(fileList: FileList): Promise<void> {

    if (!fileList.length) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png'];
    const file = fileList[0];

    if (!allowedTypes.includes(file.type)) {
      return;
    }

    const iconFormControl = this.form.get('icon');

    const isBase64 = false;
    const savedFile = await this.fileService.upload(file, file.name, isBase64);
    iconFormControl.setValue(savedFile);
    this.changeDetectorRef.markForCheck();
  }

  onRemoveMapMarkerIcon(): void {

    const iconFormControl = this.form.get('icon');
    iconFormControl.setValue(null);

    this.mapMarkerIconFileInput.nativeElement.value = null;
  }

  onSetImageAsFeatured(image: Parse.File): void {
    const imageFormControl = this.form.get('image');
    imageFormControl.setValue(image);
  }

  onRemoveImage(image: Parse.File): void {

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
        this.images = this.images.filter(img => img._url !== image._url);
        this.changeDetectorRef.markForCheck();
      }
    });

  }

  onMoveImage(event: CdkDragDrop<number>) {
    moveItemInArray(this.images, event.previousContainer.data, event.container.data);
  }

  onRemoveGooglePhoto(image: string): void {

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
        this.googlePhotos = this.googlePhotos.filter(img => img !== image);
        this.changeDetectorRef.markForCheck();
      }
    });

  }

  async loadPlace(id: string): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.place = await this.placeService.findOne(id);

      this.images = [...this.place.images];

      if (this.place.location) {

        this.googleMapsLoaded$.pipe(
          takeUntil(this.unsubscribeAll),
        ).subscribe(async () => {
          this.changeDetectorRef.markForCheck();

          setTimeout(() => {

            this.map.panTo({
              lat: this.place.location.latitude,
              lng: this.place.location.longitude,
            });

            this.map.googleMap.setZoom(15);

            this.mapMarker.marker.setPosition({
              lat: this.place.location.latitude,
              lng: this.place.location.longitude,
            });
          });

        });

      }

      this.form.patchValue({
        title: this.place.title,
        description: this.place.description,
        tags: this.place.tags,
        longDescription: this.place.longDescription,
        categories: this.place.categories,
        user: this.place.user,
        phone: this.place.phone,
        email: this.place.email,
        address: this.place.address,
        website: this.place.website,
        whatsapp: this.place.whatsapp,
        facebook: this.place.facebook,
        instagram: this.place.instagram,
        youtube: this.place.youtube,
        status: this.place.status,
        priceRange: this.place.priceRange,
        expiresAt: this.place.expiresAt,
        isFeatured: this.place.isFeatured,
        image: this.place.image,
        icon: this.place.icon,
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
      this.loadGoogleMaps();
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

          await this.place.destroy();
          this.placeService.onPlaceDestroyed(this.place);

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
        this.place = new Place;
      }

      this.changeDetectorRef.markForCheck();

      const location = this.map.getCenter().toJSON();

      this.place.location = {
        latitude: location.lat,
        longitude: location.lng,
      };

      await this.place.save({
        ...formData,
        images: this.images,
        googlePhotos: this.googlePhotos,
      });

      if (this.mode === this.ViewMode.CREATE) {
        this.placeService.onPlaceCreated(this.place);
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

