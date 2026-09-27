import { Pipe, PipeTransform } from '@angular/core';
import {
  formatTransitLocation,
  abbreviateTransitLocation,
  TransitFormatMode,
} from '../utils/transit.utils';

@Pipe({
  name: 'transitLocation',
  standalone: true,
})
export class TransitLocationPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    mode: TransitFormatMode = 'standard'
  ): string {
    return formatTransitLocation(value, { mode });
  }
}

@Pipe({
  name: 'abbreviateTransit',
  standalone: true,
})
export class AbbreviateTransitPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return abbreviateTransitLocation(value);
  }
}
