import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { BaseComponent } from 'app/core/base/base.component';
import { ParseUser } from 'app/core/user/parse-user.model';

@Component({
  selector: 'auth-sign-up',
  templateUrl: './sign-up.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class AuthSignUpComponent extends BaseComponent implements OnInit {

  @ViewChild('signUpNgForm') signUpNgForm: NgForm;

  public alert: { type: FuseAlertType; message: string };
  public signUpForm: FormGroup;
  public showAlert: boolean = false;

  constructor(injector: Injector,
    private formBuilder: FormBuilder,
  ) {
    super(injector);
  }

  ngOnInit() {
    this.signUpForm = this.formBuilder.group({
      name: ['Fernando', Validators.required],
      email: ['fer@quanlabs.com', [Validators.required, Validators.email]],
      password: ['demodemo', Validators.required],
      agreements: [true, Validators.requiredTrue],
    });
  }


  async signUp() {

    if (this.signUpForm.invalid) {
      return;
    }

    this.signUpForm.disable();
    this.showAlert = false;

    try {

      const formData = {
        name: this.signUpForm.get('name').value,
        username: this.signUpForm.get('email').value,
        email: this.signUpForm.get('email').value,
        password: this.signUpForm.get('name').value,
      }

      const user = new ParseUser;

      await user.signUp(formData);

      this.router.navigateByUrl('/confirmation-required');

    } catch (error) {

      this.signUpForm.enable();

      let transKey = 'ERROR_NETWORK';

      if (error.code === 202) {
        transKey = 'USERNAME_TAKEN';
      } else if (error.code === 203) {
        transKey = 'EMAIL_ADDRESS_TAKEN';
      } else if (error.code === 125) {
        transKey = 'EMAIL_ADDRESS_INVALID';
      }

      const transValue = this.getTrans(transKey);

      this.alert = {
        type: 'error',
        message: transValue,
      };

      this.showAlert = true;

    }

  }
}
