import { Injector } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { environment } from 'environments/environment';
import { TranslocoService } from '@ngneat/transloco';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

enum ViewState {
  LOADING,
  ERROR,
  EMPTY,
  CONTENT,
};

enum ViewMode {
  CREATE,
  UPDATE,
}

export abstract class BaseComponent {

  public state: ViewState;
  public ViewState = ViewState;

  public mode: ViewMode;
  public ViewMode = ViewMode;

  protected router: Router;
  protected activatedRoute: ActivatedRoute;

  protected translocoService: TranslocoService;

  private snackBar: MatSnackBar;

  private title: Title;

  constructor(injector: Injector) {
    this.router = injector.get(Router);
    this.activatedRoute = injector.get(ActivatedRoute);
    this.title = injector.get(Title);
    this.translocoService = injector.get(TranslocoService);
    this.snackBar = injector.get(MatSnackBar);
  }

  public get isProduction(): boolean {
    return environment.production;
  }

  public get pageSize(): number {
    return environment.pageSize;
  }

  public setPageTitle(title: string) {
    const str = this.getTrans('APP_NAME');
    this.title.setTitle(`${title} - ${str}`);
  }

  showLoadingView() {
    this.state = ViewState.LOADING;
  }


  showContentView() {
    this.state = ViewState.CONTENT;
  }

  showEmptyView() {
    this.state = ViewState.EMPTY;
  }

  showErrorView() {
    this.state = ViewState.ERROR;
  }

  navigateTo(page: any, queryParams: any = {}) {
    return this.router.navigate([page], { queryParams: queryParams });
  }

  navigateToRelative(page: any, queryParams: any = null) {
    return this.router.navigate([page], {
      queryParams: queryParams,
      relativeTo: this.activatedRoute,
      queryParamsHandling: queryParams ? 'merge' : '',
    });
  }

  getParams() {
    return this.activatedRoute.snapshot.params;
  }

  getQueryParams() {
    return this.activatedRoute.snapshot.queryParams;
  }

  getTrans(key: string | string[], params: any = {}) {
    return this.translocoService.translate(key, params);
  }

  getDefaultLang() {
    return this.translocoService.getDefaultLang();
  }

  showToast(message: string, action?: string, config: MatSnackBarConfig = {
    duration: 3000,
  }) {
    this.snackBar.open(message, action, config);
  }

}
