import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, finalize } from 'rxjs';
import { Page } from '../data/api-models';

interface FieldError { campo: string; mensagem: string; }

export function uncertain(error: unknown) {
  return (error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500)) ||
    (error instanceof Error && error.name === 'TimeoutError');
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const payload = error.error as { mensagem?: string; erros?: FieldError[] } | null;
    if (error.status === 0) return 'Sem conexão com a EcoTech. Verifique a conexão e tente novamente.';
    if (error.status === 401) return 'Credenciais inválidas ou sessão expirada.';
    if (error.status === 403) return 'Você não tem permissão para esta ação.';
    if (error.status === 404) return 'O recurso não foi encontrado.';
    if (error.status === 413) return 'O arquivo excede o tamanho permitido.';
    if (error.status >= 500) return 'O serviço está indisponível no momento.';
    const fields = payload?.erros;
    if (Array.isArray(fields) && fields.length) {
      return fields.map(field => field.mensagem).join(' ');
    }
    if (typeof payload?.mensagem === 'string') return payload.mensagem;
  }
  if (error instanceof Error && error.name === 'TimeoutError') return 'A EcoTech demorou para responder. O servidor pode estar iniciando: tente novamente em instantes.';
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export class RequestState {
  busy = false;
  error = '';
  success = '';
  private active?: Subscription;

  constructor(private destroy: DestroyRef = inject(DestroyRef)) {}

  run<T>(source: Observable<T>, next: (value: T) => void, failed?: (error: unknown) => void) {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.success = '';
    this.active = source.pipe(
      takeUntilDestroyed(this.destroy),
      finalize(() => { this.busy = false; })
    ).subscribe({
      next,
      error: error => {
        this.error = errorMessage(error);
        failed?.(error);
      }
    });
  }

  reset() {
    this.active?.unsubscribe();
    this.error = '';
    this.success = '';
  }
}

export class Paginated<T extends { id: string }> {
  readonly request = new RequestState();
  items: T[] = [];
  page = 0;
  last = false;
  total: number | null = null;

  constructor(private fetch: (page: number) => Observable<Page<T>>) {}

  reset() {
    this.request.reset();
    this.items = [];
    this.page = 0;
    this.last = false;
    this.total = null;
    this.load();
  }

  load() {
    if (this.last || this.request.busy) return;
    this.request.run(this.fetch(this.page), response => {
      const merged = new Map(this.items.map(item => [item.id, item]));
      response.content.forEach(item => merged.set(item.id, item));
      this.items = [...merged.values()];
      this.last = response.last || response.number + 1 >= response.totalPages;
      this.page = response.number + 1;
      this.total = response.totalElements;
    });
  }
}

export function trackId(_index: number, item: { id: string }) { return item.id; }
