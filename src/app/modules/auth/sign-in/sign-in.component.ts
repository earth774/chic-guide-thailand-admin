import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { ParseUser } from 'app/core/user/parse-user.model';
import { BaseComponent } from 'app/core/base/base.component';
import { ParseUserService } from 'app/core/user/parse-user.service';

@Component({
  selector: 'auth-sign-in',
  templateUrl: './sign-in.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class AuthSignInComponent extends BaseComponent implements OnInit {

  @ViewChild('signInNgForm') signInNgForm: NgForm;

  public alert: { type: FuseAlertType; message: string };

  public signInForm: FormGroup;
  public showAlert: boolean = false;

  constructor(injector: Injector,
    private userService: ParseUserService,
    private formBuilder: FormBuilder) {
    super(injector);
  }

  ngOnInit(): void {

    this.signInForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  async signIn() {

    if (this.signInForm.invalid) {
      return;
    }

    this.signInForm.disable();
    this.showAlert = false;

    try {

      const username = this.signInForm.value.username.trim();
      const password = this.signInForm.value.password.trim();

      await this.userService.canLogin(username);

      const user = new ParseUser;
      user.username = username;
      user.password = password;

      await user.logIn();

      // Set the redirect url.
      // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
      // to the correct page after a successful sign in. This way, that url can be set via
      // routing file and we don't have to touch here.
      const redirectURL = this.activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

      this.router.navigateByUrl(redirectURL);

    } catch (error) {

      this.signInForm.enable();

      let transKey = 'ERROR_NETWORK';

      if (error.code === 101) {
        transKey = 'CREDENTIALS_INVALID';
      } else if (error.code === 5000) {
        transKey = 'USER_NOT_FOUND';
      } else if (error.code === 5001) {
        transKey = 'NOT_AUTHORIZED';
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
