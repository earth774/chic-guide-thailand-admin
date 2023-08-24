import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { BaseComponent } from 'app/core/base/base.component';
import { ParseUser } from 'app/core/user/parse-user.model';
import Utils from 'app/core/utils/utils';

@Component({
  selector: 'settings-security',
  templateUrl: './security.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class SettingsSecurityComponent extends BaseComponent implements OnInit {

  public form: FormGroup;
  public alert: { type?: FuseAlertType; message?: string } = {};

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    }, { updateOn: 'change' });
  }

  async onSaveButtonClicked(): Promise<void> {

    try {

      if (this.form.invalid) {
        return;
      }

      this.showLoadingView();

      const formData = this.form.getRawValue();

      this.alert.message = null;

      const user = ParseUser.current() as ParseUser;

      await (ParseUser as any).verifyPassword(
        user.username,
        formData.currentPassword
      );

      await user.save({ password: formData.newPassword });

      const transValue = this.getTrans('CHANGES_SAVED');
      this.alert.message = transValue;
      this.alert.type = 'success';

      this.showContentView();

    } catch (error) {

      let transValue = 'ERROR_NETWORK';

      if (error.code === 101) {
        transValue = 'CURRENT_PASSWORD_INVALID';
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
