import { Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { defaultNavigation } from './navigation.data';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  private readonly defaultNavigation: FuseNavigationItem[] = defaultNavigation;

  constructor() {
  }

  get(): FuseNavigationItem[] {
    return this.defaultNavigation;
  }
}
