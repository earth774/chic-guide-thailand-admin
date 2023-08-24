import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BooleanInput } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { ParseUser } from 'app/core/user/parse-user.model';
import Utils from 'app/core/utils/utils';
import { BaseComponent } from 'app/core/base/base.component';

@Component({
  selector: 'user',
  templateUrl: './user.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'user'
})
export class UserComponent extends BaseComponent implements OnInit, OnDestroy {

  /* eslint-disable @typescript-eslint/naming-convention */
  static ngAcceptInputTypeshowAvatar: BooleanInput;
  /* eslint-enable @typescript-eslint/naming-convention */

  @Input() showAvatar: boolean = true;

  public user: ParseUser;
  public isLoading: boolean;

  private unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef) {
    super(injector);
  }

  ngOnInit(): void {
    this.user = ParseUser.current();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  onSettingsButtonClicked(): void {
    this.router.navigate(['/settings']);
  }

  async onSignOutButtonClicked(): Promise<void> {

    try {
      this.isLoading = true;

      await ParseUser.logOut();

      this.isLoading = false;

      this.router.navigate(['/sign-out']);

    } catch {
      const transValue = this.getTrans('ERROR_NETWORK');
      this.showToast(transValue);
    } finally {
      this.changeDetectorRef.markForCheck();
    }

  }
}
