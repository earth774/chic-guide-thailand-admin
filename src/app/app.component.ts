import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ParseUser } from './core/user/parse-user.model';
import { ParseUserService } from './core/user/parse-user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(private router: Router,
    private userService: ParseUserService) { }

  ngOnInit(): void {
    this.loadUser();

    this.userService.userSessionExpired$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.onLogOut();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  async loadUser() {

    const user = ParseUser.current();

    if (user) {
      try {
        await user.fetch();
      } catch (error) {
        if (error.code === 209) {
          this.onLogOut();
        }
      }
    }

  }

  async onLogOut() {

    try {
      await ParseUser.logOut();
    } catch (err) {
      if (err.code === 209) {
        this.router.navigate(['/sign-out']);
      }
    }

  }
}
