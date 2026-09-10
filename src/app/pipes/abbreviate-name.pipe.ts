import { Pipe, PipeTransform } from '@angular/core';
import { abbreviateName } from '../utils/mask.utils';

@Pipe({
  name: 'abbreviateName',
  standalone: true,
})
export class AbbreviateNamePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return abbreviateName(value);
  }
}
