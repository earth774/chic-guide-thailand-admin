import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FuseAlertType } from '@fuse/components/alert';
import { BaseComponent } from 'app/core/base/base.component';
import Utils from 'app/core/utils/utils';
import { AppConfig } from './app-config.model';
import { AppConfigService } from './app-config.service';
import { fuseAnimations } from '@fuse/animations';

@Component({
  selector: 'app-config',
  templateUrl: './app-config.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class AppConfigComponent extends BaseComponent implements OnInit, OnDestroy {

  public appConfig: AppConfig;
  public form: FormGroup;

  public alert: { type?: FuseAlertType; message?: string } = {};

  public quillModules: any = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ align: [] }, { list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  private unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(injector: Injector,
    private formBuilder: FormBuilder,
    private appConfigService: AppConfigService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupForm();
    this.loadAppConfig();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  setupForm(): void {

    this.form = this.formBuilder.group({
      isSlidesIntroDisabled: [false],
      searchRadius: [''],
      stripePublicKey: [''],
      enablePaidListings: [false],
      enablePromotedListings: [false],
      enableAutoApproveListings: [false],
      isReviewDisabled: [false],
      isReviewAutoApproveEnabled: [false],
      isReviewMultiplePerUserEnabled: [false],
      isFacebookLoginEnabled: [false],
      isGoogleLoginEnabled: [false],
      isAppleLoginEnabled: [false],
      notificationEmail: [''],
      description: [''],
      terms: [''],
      googlePlayUrl: [''],
      appStoreUrl: [''],
      facebook: [''],
      instagram: [''],
      youtube: [''],
      contactPhone: [''],
      contactEmail: [''],
    }, { updateOn: 'change' });
  }

  async loadAppConfig(): Promise<void> {
    try {

      this.showLoadingView();
      this.changeDetectorRef.markForCheck();

      this.appConfig = await this.appConfigService.get();

      this.form.patchValue({
        isSlidesIntroDisabled: this.appConfig.slides?.disabled,
        searchRadius: this.appConfig.places?.searchRadius,
        stripePublicKey: this.appConfig.stripePublicKey,
        enablePaidListings: this.appConfig.places?.enablePaidListings,
        enablePromotedListings: this.appConfig.places?.enablePromotedListings,
        enableAutoApproveListings: this.appConfig.places?.autoApprove,
        isReviewDisabled: this.appConfig.reviews?.disabled,
        isReviewAutoApproveEnabled: this.appConfig.reviews?.autoApprove,
        isReviewMultiplePerUserEnabled: this.appConfig.reviews?.multiplePerUser,
        isFacebookLoginEnabled: this.appConfig.auth?.isFacebookLoginEnabled,
        isGoogleLoginEnabled: this.appConfig.auth?.isGoogleLoginEnabled,
        isAppleLoginEnabled: this.appConfig.auth?.isAppleLoginEnabled,
        notificationEmail: this.appConfig.email?.addressForNotifications,
        googlePlayUrl: this.appConfig.about?.googlePlayUrl,
        appStoreUrl: this.appConfig.about?.appStoreUrl,
        facebook: this.appConfig.about?.facebook,
        instagram: this.appConfig.about?.instagram,
        youtube: this.appConfig.about?.youtube,
        contactPhone: this.appConfig.about?.phone,
        contactEmail: this.appConfig.about?.email,
        description: this.appConfig.about?.description,
        terms: this.appConfig.about?.terms,
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

  async onSaveButtonClicked(): Promise<void> {

    try {

      if (this.form.invalid) {
        return;
      }

      this.showLoadingView();

      const formData = this.form.getRawValue();

      this.alert.message = null;

      if (!this.appConfig) {
        this.appConfig = new AppConfig;
      }

      await this.appConfig.save({
        places: {
          searchRadius: formData.searchRadius,
          enablePaidListings: formData.enablePaidListings,
          enablePromotedListings: formData.enablePromotedListings,
          autoApprove: formData.enableAutoApproveListings,
        },
        reviews: {
          disabled: formData.isReviewDisabled,
          autoApprove: formData.isReviewAutoApproveEnabled,
          multiplePerUser: formData.isReviewMultiplePerUserEnabled,
        },
        slides: {
          disabled: formData.isSlidesIntroDisabled,
        },
        about: {
          description: formData.description,
          terms: formData.terms,
          googlePlayUrl: formData.googlePlayUrl,
          appStoreUrl: formData.appStoreUrl,
          facebook: formData.facebook,
          instagram: formData.instagram,
          youtube: formData.youtube,
          phone: formData.contactPhone,
          email: formData.contactEmail,
        },
        auth: {
          isFacebookLoginEnabled: formData.isFacebookLoginEnabled,
          isGoogleLoginEnabled: formData.isGoogleLoginEnabled,
          isAppleLoginEnabled: formData.isAppleLoginEnabled,
        },
        email: {
          addressForNotifications: formData.notificationEmail,
        },
        stripePublicKey: formData.stripePublicKey,
      });

      const transValue = this.getTrans('CHANGES_SAVED');
      this.alert.message = transValue;
      this.alert.type = 'success';

      this.showContentView();

    } catch (error) {

      console.log(error);

      const transValue = this.getTrans('ERROR_NETWORK');
      this.alert.message = transValue;
      this.alert.type = 'error';

      this.showContentView();

    } finally {
      this.changeDetectorRef.markForCheck();

      setTimeout(() => {
        this.alert.message = null;
        this.changeDetectorRef.markForCheck();
      }, 3000);
    }
  }

}
