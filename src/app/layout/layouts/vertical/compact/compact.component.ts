import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { ParseUser } from 'app/core/user/parse-user.model';

@Component({
  selector: 'compact-layout',
  templateUrl: './compact.component.html',
  encapsulation: ViewEncapsulation.None
})
export class CompactLayoutComponent implements OnInit, OnDestroy {

  public isScreenSmall: boolean;
  public navigation: Navigation;
  public user: ParseUser;
  private unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private navigationService: NavigationService,
    private fuseMediaWatcherService: FuseMediaWatcherService,
    private fuseNavigationService: FuseNavigationService
  ) { }

  ngOnInit(): void {

    this.user = ParseUser.current();

    let navigationItems = this.navigationService.get();

    if (this.user?.isAdmin()) {
      navigationItems = navigationItems.filter(item => {
        return this.user?.permissions?.includes(item.id);
      });
    }

    this.navigation = {
      default: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'basic',
          icon: 'heroicons_outline:cloud',
          link: '/dashboard',
        },
        ...navigationItems
      ],
    };

    // Subscribe to media changes
    this.fuseMediaWatcherService.onMediaChange$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(({ matchingAliases }) => {

        // Check if the screen is small
        this.isScreenSmall = !matchingAliases.includes('md');
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  toggleNavigation(name: string): void {
    // Get the navigation
    const navigation = this.fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

    if (navigation) {
      // Toggle the opened status
      navigation.toggle();
    }
  }
}
