import { DatePipe } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { API_TIMEZONE } from '../services/api.config';

const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * A API envia LocalDateTime sem fuso (ex.: 2026-11-27T19:00:00), gravado em UTC.
 * Sem o sufixo, o navegador leria como hora local e mostraria 3 h a mais no Brasil.
 */
export function apiDate(value: string | null | undefined, timezone = API_TIMEZONE): string | null {
  if (!value) return null;
  if (timezone.toLowerCase() !== 'utc' || HAS_OFFSET.test(value)) return value;
  return value + 'Z';
}

/** Igual ao pipe `date`, mas interpreta corretamente as datas da API. */
@Pipe({ name: 'apiDate', standalone: false })
export class ApiDatePipe implements PipeTransform {
  private readonly date = new DatePipe(inject(LOCALE_ID));

  transform(value: string | null | undefined, format = 'dd/MM/yyyy HH:mm'): string | null {
    return this.date.transform(apiDate(value), format);
  }
}
