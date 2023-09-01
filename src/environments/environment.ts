// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  serverUrl: 'https://api.chicguidethailand.com',
  appId: 'ChicGuidThailand',
  languages: [{
    id: 'en',
    locale: 'en-US',
    default: true,
    label: 'English',
  }, {
    id: 'es',
    locale: 'es-MX',
    default: false,
    label: 'Spanish',
  }],
  showLanguageSelector: true,
  googleMapsApiKey: 'AIzaSyDYsWCmb62mEqZQ9pNz_QoWPSZHY9GV_s8',
  pageSize: 25,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
