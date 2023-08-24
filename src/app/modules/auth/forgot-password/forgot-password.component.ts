import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { ParseUser } from 'app/core/user/parse-user.model';
import { BaseComponent } from 'app/core/base/base.component';

@Component({
  selector: 'auth-forgot-password',
  templateUrl: './forgot-password.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class AuthForgotPasswordComponent extends BaseComponent implements OnInit {

  @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;

  public alert: { type: FuseAlertType; message: string };
  public forgotPasswordForm: FormGroup;
  public showAlert: boolean = false;

  constructor(injector: Injector,
    private formBuilder: FormBuilder,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async sendResetLink() {

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.forgotPasswordForm.disable();
    this.showAlert = false;

    try {

      const email = this.forgotPasswordForm.value.email;
      await ParseUser.requestPasswordReset(email);

      const transValue = this.getTrans('PASSWORD_REQUESTED');

      this.alert = {
        type: 'success',
        message: transValue,
      };

    } catch (error) {

      const transValue = this.getTrans('ERROR_NETWORK');

      this.alert = {
        type: 'error',
        message: transValue,
      };

    } finally {
      this.forgotPasswordForm.enable();
      this.forgotPasswordNgForm.resetForm();
      this.showAlert = true;
    }
  }
}
