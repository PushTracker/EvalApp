import { Injectable, NgZone } from '@angular/core';

import { Kinvey } from 'kinvey-nativescript-sdk';
import * as geolocation from 'nativescript-geolocation';
import { Accuracy } from 'ui/enums'; // used to describe at what accuracy the location should be get
const httpModule = require('http');
var api_key = 'pk.eyJ1IjoiZmluZ2VyNTYzIiwiYSI6ImNqYXZmYTZ0bDVtYmcyd28yZ2ZwandxYWcifQ.ROCLEdkuzALMsVQedcIeAQ';

// see https://www.mapbox.com/api-documentation/?language=cURL#retrieve-places-near-a-location

@Injectable()
export class LocationService {
  public static getCoordinates(): Promise<any> {
    // Get current location with high accuracy
    return geolocation.getCurrentLocation({
      desiredAccuracy: Accuracy.high,
      maximumAge: 5000,
      timeout: 20000
    });
  }

  public static getLocation(): Promise<string> {
    return LocationService.getCoordinates().then(coords => {
      return LocationService.coordToLocation(coords);
    });
  }

  public static getLocationData(): Promise<any> {
    let coords = {};
    return LocationService.getCoordinates()
      .then(_coords => {
        coords = _coords;
        return LocationService.coordToLocation(coords);
      })
      .then(place_name => {
        return Object.assign(coords, { place_name: place_name });
      });
  }

  public static coordToLocation(coord: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let userLoc = `${coord.longitude},${coord.latitude}`;
      let user = Kinvey.User.getActiveUser();
      let userData = ((user && user.data) || {}) as any;
      let lang = userData.language ? '&language=' + userData.language : '';
      let query =
        'https://api.mapbox.com/geocoding/v5/mapbox.places/' + userLoc + '.json?access_token=' + api_key + lang;
      // TODO: might also add '&types=postcode' to the query to only get postcode
      httpModule.getJSON(query).then(
        function(r) {
          const location = r.features.filter(f => f.place_type.indexOf('postcode') > -1)[0].place_name;
          resolve(location);
        },
        function(e) {
          reject(`Couldn't get location: ${e}`);
        }
      );
    });
  }
}
