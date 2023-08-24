import { Component, Injector, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { BaseComponent } from 'app/core/base/base.component';

@Component({
  selector: 'auth-sign-out',
  templateUrl: './sign-out.component.html',
  encapsulation: ViewEncapsulation.None
})
export class AuthSignOutComponent extends BaseComponent implements OnInit, OnDestroy {

  public countdown: number = 5;
  public countdownMapping: any = {};

  private unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {

    const transValues = this.getTrans(['SECOND', 'SECONDS']);

    this.countdownMapping = {
      '=1': `# ${transValues[0].toLowerCase()}`,
      'other': `# ${transValues[1].toLowerCase()}`
    };

    // Redirect after the countdown
    timer(1000, 1000)
      .pipe(
        finalize(() => {
          this.router.navigate(['sign-in']);
        }),
        takeWhile(() => this.countdown > 0),
        takeUntil(this.unsubscribeAll),
        tap(() => this.countdown--)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }
}
