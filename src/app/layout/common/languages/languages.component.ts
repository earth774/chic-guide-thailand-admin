import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { take } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { environment } from 'environments/environment';

@Component({
  selector: 'languages',
  templateUrl: './languages.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'languages',
})
export class LanguagesComponent implements OnInit, OnDestroy {

  public availableLangs: any;
  public activeLang: any;
  public flagCodes: any;

  public canShow = environment.showLanguageSelector;

  constructor(
    private fuseNavigationService: FuseNavigationService,
    private translocoService: TranslocoService,
  ) { }

  ngOnInit(): void {
    // Get the available languages from transloco
    this.availableLangs = environment.languages;

    // Subscribe to language changes
    this.translocoService.langChanges$.subscribe((activeLang) => {

      // Get the active lang
      this.activeLang = this.availableLangs.find((lang: any) => lang.id === activeLang);

      // Update the navigation
      this.updateNavigation();
    });

  }
  ngOnDestroy(): void { }

  setActiveLang(lang: string): void {
    // Set the active lang
    this.translocoService.setActiveLang(lang);
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  private updateNavigation(): void {

    // Get the component -> navigation data -> item
    const navComponent = this.fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

    // Return if the navigation component does not exist
    if (!navComponent) {
      return null;
    }

    // Get the flat navigation data
    const navigation = navComponent.navigation;

    const transValues = navigation.map(item => item.id.toUpperCase());

    this.translocoService.selectTranslate(transValues).pipe(take(1))
      .subscribe(translation => {

        navigation.forEach((item, index) => {
          const navigationItem = this.fuseNavigationService.getItem(item.id, navigation);
          navigationItem.title = translation[index];
        });

        // Refresh the navigation component
        navComponent.refresh();
      });

  }
}
