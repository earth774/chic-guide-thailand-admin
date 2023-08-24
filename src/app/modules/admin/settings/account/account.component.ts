import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { BaseComponent } from 'app/core/base/base.component';
import { FileService } from 'app/core/file/file.service';
import { ParseUser } from 'app/core/user/parse-user.model';
import Utils from 'app/core/utils/utils';

@Component({
  selector: 'settings-account',
  templateUrl: './account.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class SettingsAccountComponent extends BaseComponent implements OnInit {

  @ViewChild('imageFileInput') private imageFileInput: ElementRef;

  public form: FormGroup;

  public alert: { type?: FuseAlertType; message?: string } = {};

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fileService: FileService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {

    const user = ParseUser.current() as ParseUser;
    this.form = this.formBuilder.group({
      name: [user.name, [Validators.required]],
      username: [user.username, [Validators.required]],
      email: [user.email, [Validators.email]],
      photo: [user.photo],
    }, { updateOn: 'change' });
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

    const imageFormControl = this.form.get('photo');

    const isBase64 = false;
    const savedFile = await this.fileService.upload(file, file.name, isBase64);
    imageFormControl.setValue(savedFile);
    this.changeDetectorRef.markForCheck();
  }

  onRemoveImage(): void {

    const imageFormControl = this.form.get('photo');
    imageFormControl.setValue(null);

    this.imageFileInput.nativeElement.value = null;
  }

  async onSaveButtonClicked(): Promise<void> {

    try {

      if (this.form.invalid) {
        return;
      }

      this.showLoadingView();

      const formData = this.form.getRawValue();

      this.alert.message = null;

      if (!formData.email) delete formData.email;

      const user = ParseUser.current();

      await user.save(formData);

      const transValue = this.getTrans('CHANGES_SAVED');
      this.alert.message = transValue;
      this.alert.type = 'success';

      this.showContentView();

    } catch (error) {

      let transValue = 'ERROR_NETWORK';

      if (error.code === 202) {
        transValue = 'USERNAME_TAKEN';
      } else if (error.code === 203) {
        transValue = 'EMAIL_TAKEN';
      } else if (error.code === 125) {
        transValue = 'EMAIL_INVALID';
      }

      transValue = this.getTrans(transValue);
      this.alert.message = transValue;
      this.alert.type = 'error';

      this.showContentView();

    } finally {
      this.changeDetectorRef.markForCheck();
    }
  }
}
