import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {

  @ViewChild('drawer') drawer: MatDrawer;
  public drawerMode: 'over' | 'side' = 'side';
  public drawerOpened: boolean = true;
  public panels: any[] = [];
  public selectedPanel: string = 'account';

  private unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private fuseMediaWatcherService: FuseMediaWatcherService
  ) { }

  ngOnInit(): void {

    this.panels = [
      {
        id: 'account',
        icon: 'heroicons_outline:user-circle',
        title: 'Account',
      },
      {
        id: 'security',
        icon: 'heroicons_outline:lock-closed',
        title: 'Security',
      },
    ];

    // Subscribe to media changes
    this.fuseMediaWatcherService.onMediaChange$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(({ matchingAliases }) => {

        // Set the drawerMode and drawerOpened
        if (matchingAliases.includes('lg')) {
          this.drawerMode = 'side';
          this.drawerOpened = true;
        }
        else {
          this.drawerMode = 'over';
          this.drawerOpened = false;
        }

        this.changeDetectorRef.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  goToPanel(panel: string): void {
    this.selectedPanel = panel;

    // Close the drawer on 'over' mode
    if (this.drawerMode === 'over') {
      this.drawer.close();
    }
  }

  getPanelInfo(id: string): any {
    return this.panels.find(panel => panel.id === id);
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
