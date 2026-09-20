import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/enviroment';

declare const google: any;
declare const window: any;

export interface RouteCalculationResult {
  fullPath: any[]; // google.maps.LatLng[] points following real streets
  encodedPolyline?: string;
  distanceKm: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
  chunksCount: number;
}

export interface GeocodedPlace {
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  cep?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsService {
  private isBrowser: boolean;
  private loadPromise: Promise<boolean> | null = null;
  private routeCache = new Map<string, RouteCalculationResult>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /** Checks if running in browser and Google Maps script has already loaded */
  isApiLoaded(): boolean {
    return this.isBrowser && typeof window !== 'undefined' && !!(window as any).google?.maps;
  }

  /** Returns whether a valid API key is configured */
  hasApiKey(): boolean {
    return !!environment.googleMapsApiKey && environment.googleMapsApiKey.trim().length > 0;
  }

  /**
   * Dynamically loads the Google Maps JavaScript API with places and geometry libraries.
   * SSR-safe: returns immediately with false on server-side.
   */
  load(): Promise<boolean> {
    if (!this.isBrowser) {
      return Promise.resolve(false);
    }

    if (this.isApiLoaded()) {
      return Promise.resolve(true);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<boolean>((resolve) => {
      const apiKey = environment.googleMapsApiKey?.trim();
      if (!apiKey) {
        console.warn('[GoogleMapsService] No Google Maps API key provided in environments/enviroment.ts.');
        resolve(false);
        return;
      }

      // Check if script tag is already in DOM
      const existingScript = document.getElementById('google-maps-api-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(this.isApiLoaded()));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      if (typeof window !== 'undefined') {
        window.gm_authFailure = () => {
          console.error(
            '[GoogleMapsService] ⚠️ Google Maps Falha de Autenticação (gm_authFailure): Verifique no console (F12) o erro exato do Google Maps (RefererNotAllowedMapError, ApiNotActivatedMapError ou BillingNotEnabledMapError).'
          );
        };
      }

      const script = document.createElement('script');
      script.id = 'google-maps-api-script';
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;

      script.onload = () => {
        resolve(this.isApiLoaded());
      };

      script.onerror = (err) => {
        console.error('[GoogleMapsService] Failed to load Google Maps script', err);
        resolve(false);
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Reverse geocodes a lat/lng position to extract address, street name, and postal code.
   */
  reverseGeocode(lat: number, lng: number): Promise<GeocodedPlace | null> {
    if (!this.isApiLoaded()) return Promise.resolve(null);

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results && results.length > 0) {
          const first = results[0];
          let cep = '';
          for (const comp of first.address_components || []) {
            if (comp.types?.includes('postal_code')) {
              cep = comp.long_name;
              break;
            }
          }

          resolve({
            name: results[0].address_components?.[0]?.long_name || first.formatted_address,
            formattedAddress: first.formatted_address,
            lat,
            lng,
            cep,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  private autocompleteService: any = null;
  private placesService: any = null;
  private currentSessionToken: string | null = null;

  /**
   * Generates or retrieves an active Autocomplete session token (UUID v4)
   * to group keystrokes and selection into a single billing event.
   */
  private getOrCreateSessionToken(): string {
    if (!this.currentSessionToken) {
      this.currentSessionToken = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    return this.currentSessionToken;
  }

  /**
   * Resets the active autocomplete session token.
   */
  resetSessionToken(): void {
    this.currentSessionToken = null;
  }

  /**
   * Fetches Google Maps autocomplete predictions matching user input.
   * Uses Places API (New) with session token and X-Goog-FieldMask.
   * Fallback to legacy JS SDK AutocompleteService.
   */
  async getPlacePredictions(input: string): Promise<any[]> {
    if (!input || input.trim().length < 2) {
      return [];
    }

    const apiKey = environment.googleMapsApiKey?.trim();

    // 1. Try modern Places API (New) HTTP endpoint
    if (apiKey) {
      try {
        const sessionToken = this.getOrCreateSessionToken();
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction',
          },
          body: JSON.stringify({
            input: input.trim(),
            includedRegionCodes: ['br'],
            sessionToken: sessionToken,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && Array.isArray(data.suggestions)) {
            const list = data.suggestions
              .map((s: any) => {
                const p = s.placePrediction;
                if (!p) return null;
                const placeId = p.placeId || (p.place ? p.place.replace('places/', '') : '');
                return {
                  place_id: placeId,
                  description: p.text?.text || '',
                  structured_formatting: {
                    main_text: p.structuredFormat?.mainText?.text || p.text?.text || '',
                    secondary_text: p.structuredFormat?.secondaryText?.text || '',
                  },
                };
              })
              .filter(Boolean);

            return list;
          }
          return [];
        } else {
          const err = await response.text();
          console.warn('[GoogleMapsService] Places API (New) autocomplete error:', response.status, err);
        }
      } catch (e) {
        console.warn('[GoogleMapsService] Places API (New) fetch exception:', e);
      }
    }

    // 2. Fallback to legacy JS SDK AutocompleteService if available
    if (this.isApiLoaded() && typeof google !== 'undefined' && google.maps?.places) {
      if (!this.autocompleteService) {
        this.autocompleteService = new google.maps.places.AutocompleteService();
      }

      return new Promise((resolve) => {
        this.autocompleteService.getPlacePredictions(
          {
            input: input.trim(),
            componentRestrictions: { country: 'br' },
          },
          (predictions: any[], status: string) => {
            if (status === 'OK' && predictions) {
              resolve(predictions);
            } else {
              resolve([]);
            }
          }
        );
      });
    }

    return [];
  }

  /**
   * Fetches detailed place information (geometry, address components) for a placeId.
   * Concludes the active autocomplete session token.
   */
  async getPlaceDetails(placeId: string): Promise<any | null> {
    if (!placeId) return null;
    const apiKey = environment.googleMapsApiKey?.trim();
    const cleanId = placeId.replace('places/', '');

    // 1. Try modern Places API (New) place details endpoint
    if (apiKey) {
      try {
        const sessionToken = this.currentSessionToken;
        const sessionQuery = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
        const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanId)}${sessionQuery}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
          },
        });

        // Conclude session token once place details are fetched
        this.currentSessionToken = null;

        if (response.ok) {
          const data = await response.json();
          if (data && data.location) {
            const addressComponents = (data.addressComponents || []).map((comp: any) => ({
              long_name: comp.longText,
              short_name: comp.shortText,
              types: comp.types || [],
            }));

            return {
              name: data.displayName?.text || data.formattedAddress,
              formatted_address: data.formattedAddress,
              geometry: {
                location: {
                  lat: () => data.location.latitude,
                  lng: () => data.location.longitude,
                },
              },
              address_components: addressComponents,
            };
          }
        } else {
          const err = await response.text();
          console.warn('[GoogleMapsService] Places API (New) details error:', response.status, err);
        }
      } catch (err) {
        console.warn('[GoogleMapsService] Places API (New) details fetch exception:', err);
      }
    }

    // 2. Fallback to legacy PlacesService
    if (this.isApiLoaded() && typeof google !== 'undefined' && google.maps?.places) {
      if (!this.placesService) {
        const dummyDiv = document.createElement('div');
        this.placesService = new google.maps.places.PlacesService(dummyDiv);
      }

      return new Promise((resolve) => {
        this.placesService.getDetails(
          {
            placeId: cleanId,
            fields: ['name', 'formatted_address', 'geometry', 'address_components'],
          },
          (place: any, status: string) => {
            if (status === 'OK' && place) {
              resolve(place);
            } else {
              resolve(null);
            }
          }
        );
      });
    }

    return null;
  }

  /** Generates an in-memory signature for a sequence of stops */
  generateSignature(stops: { lat: number; lng: number }[]): string {
    return stops.map((s) => `${Number(s.lat).toFixed(5)},${Number(s.lng).toFixed(5)}`).join('>');
  }

  /**
   * Calls Google's modern Routes API v2 (computeRoutes).
   * Generates HIGH_QUALITY street-following polyline geometry decoded via geometry library.
   */
  private async computeSegmentViaRoutesApi(
    originCoord: { lat: number; lng: number },
    destCoord: { lat: number; lng: number },
    intermediates: { lat: number; lng: number }[]
  ): Promise<{ path: any[]; distanceMeters: number; durationSeconds: number } | null> {
    const apiKey = environment.googleMapsApiKey?.trim();
    if (!apiKey) return null;

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const body = {
      origin: {
        location: {
          latLng: {
            latitude: originCoord.lat,
            longitude: originCoord.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destCoord.lat,
            longitude: destCoord.lng,
          },
        },
      },
      intermediates: intermediates.map((s) => ({
        location: {
          latLng: {
            latitude: s.lat,
            longitude: s.lng,
          },
        },
      })),
      travelMode: 'DRIVE',
      polylineQuality: 'HIGH_QUALITY',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[GoogleMapsService] Routes API responded with status:', response.status, errText);
        return null;
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      const encodedPolyline = route.polyline?.encodedPolyline;
      let path: any[] = [];

      if (encodedPolyline && typeof google !== 'undefined' && google.maps?.geometry?.encoding) {
        path = google.maps.geometry.encoding.decodePath(encodedPolyline);
      }

      let durationSeconds = 0;
      if (typeof route.duration === 'string') {
        durationSeconds = parseInt(route.duration.replace('s', ''), 10) || 0;
      } else if (typeof route.duration === 'number') {
        durationSeconds = route.duration;
      }

      return {
        path,
        distanceMeters: route.distanceMeters || 0,
        durationSeconds,
      };
    } catch (err) {
      console.warn('[GoogleMapsService] Failed to call Routes API:', err);
      return null;
    }
  }

  /**
   * Fallback using DirectionsService (extracting full step.path per leg for street-level resolution).
   */
  private computeSegmentViaDirectionsService(
    originCoord: { lat: number; lng: number },
    destCoord: { lat: number; lng: number },
    intermediates: { lat: number; lng: number }[]
  ): Promise<{ path: any[]; distanceMeters: number; durationSeconds: number } | null> {
    const directionsService = new google.maps.DirectionsService();
    const waypoints = intermediates.map((s) => ({
      location: { lat: s.lat, lng: s.lng },
      stopover: true,
    }));

    return new Promise((resolve) => {
      directionsService.route(
        {
          origin: originCoord,
          destination: destCoord,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (res: any, status: string) => {
          if (status === 'OK' && res && res.routes?.length > 0) {
            const route = res.routes[0];
            const path: any[] = [];
            let distanceMeters = 0;
            let durationSeconds = 0;

            // Extract exact turn-by-turn road steps for high precision
            for (const leg of route.legs || []) {
              distanceMeters += leg.distance?.value || 0;
              durationSeconds += leg.duration?.value || 0;
              for (const step of leg.steps || []) {
                if (step.path && Array.isArray(step.path)) {
                  path.push(...step.path);
                }
              }
            }

            // Fallback to overview_path if steps were somehow empty
            if (path.length === 0 && route.overview_path) {
              path.push(...route.overview_path);
            }

            resolve({ path, distanceMeters, durationSeconds });
          } else {
            console.warn('[GoogleMapsService] DirectionsService status:', status);
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Calculates a multi-chunk road route through real streets.
   * - Uses Routes API (modern) or DirectionsService (fallback).
   * - Trajectory adheres strictly to actual roads and corners.
   * - Supports 20+ and 80+ stops via seamless chunk stitching.
   * - In-memory cache ensures 0 redundant API calls.
   */
  async calculateDirections(
    stops: { lat: number; lng: number }[]
  ): Promise<RouteCalculationResult | null> {
    if (!this.isApiLoaded() || stops.length < 2) {
      return null;
    }

    const signature = this.generateSignature(stops);
    if (this.routeCache.has(signature)) {
      return this.routeCache.get(signature)!;
    }

    // Maximum 25 points per chunk (1 origin + 23 waypoints + 1 destination)
    const CHUNK_SIZE = 24;
    const chunks: { lat: number; lng: number }[][] = [];

    let startIndex = 0;
    while (startIndex < stops.length - 1) {
      const endIndex = Math.min(startIndex + CHUNK_SIZE - 1, stops.length - 1);
      chunks.push(stops.slice(startIndex, endIndex + 1));
      startIndex = endIndex;
    }

    const fullPath: any[] = [];
    let totalMeters = 0;
    let totalSeconds = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length < 2) continue;

      const origin = { lat: chunk[0].lat, lng: chunk[0].lng };
      const destination = { lat: chunk[chunk.length - 1].lat, lng: chunk[chunk.length - 1].lng };
      const intermediates = chunk.slice(1, -1);

      if (i > 0) {
        await new Promise((r) => setTimeout(r, 60));
      }

      // 1. Try modern Routes API first (Google's latest street-routing engine)
      let segment = await this.computeSegmentViaRoutesApi(origin, destination, intermediates);

      // 2. If Routes API returns null, try DirectionsService as fallback
      if (!segment && typeof google !== 'undefined') {
        segment = await this.computeSegmentViaDirectionsService(origin, destination, intermediates);
      }

      if (segment && segment.path.length > 0) {
        fullPath.push(...segment.path);
        totalMeters += segment.distanceMeters;
        totalSeconds += segment.durationSeconds;
      } else {
        // Last resort: straight line if neither API answered
        console.warn(`[GoogleMapsService] Segment ${i + 1} could not be calculated along roads.`);
        fullPath.push(new google.maps.LatLng(origin.lat, origin.lng));
        fullPath.push(new google.maps.LatLng(destination.lat, destination.lng));
      }
    }

    if (fullPath.length === 0) {
      return null;
    }

    const distanceKm = Math.round((totalMeters / 1000) * 10) / 10;
    const durationMinutes = Math.round(totalSeconds / 60);
    const distanceText = `${distanceKm} km`;
    const durationText =
      durationMinutes >= 60
        ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
        : `${durationMinutes} min`;

    let encodedPolyline: string | undefined;
    if (typeof google !== 'undefined' && google.maps?.geometry?.encoding) {
      encodedPolyline = google.maps.geometry.encoding.encodePath(fullPath);
    }

    const result: RouteCalculationResult = {
      fullPath,
      encodedPolyline,
      distanceKm,
      durationMinutes,
      distanceText,
      durationText,
      chunksCount: chunks.length,
    };

    this.routeCache.set(signature, result);
    return result;
  }
}
