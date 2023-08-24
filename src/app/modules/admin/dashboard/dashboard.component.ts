import { ChangeDetectorRef, Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';
import { BaseComponent } from 'app/core/base/base.component';
import { ParseService } from 'app/core/parse/parse.service';
import Utils from 'app/core/utils/utils';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent extends BaseComponent implements OnInit {

  public collectionsCount: { [key: string]: number } = {};
  
  constructor(injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private parseService: ParseService) {
    super(injector);
  }

  ngOnInit() {
    this.loadCollectionsCount();
  }

  async loadCollectionsCount(): Promise<void> {
    try {

      this.showLoadingView();

      const collectionsCount = await this.parseService.getCollectionsCount();
      this.collectionsCount = collectionsCount;

      this.showContentView();

    } catch (error) {

      if (error.code === 101) {
        this.showEmptyView();
      } else {
        this.showErrorView();
      }

    } finally {
      this.changeDetectorRef.markForCheck();
    }
  }

}
