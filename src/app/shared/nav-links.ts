import { Params } from '@angular/router';
import { Id } from '../data/api-models';
import { IconName } from './icons';

/** Atalho de navegação exibido na barra lateral. */
export interface NavLink {
  label: string;
  icon: IconName;
  path: string | string[];
  query?: Params;
}

/**
 * Atalhos principais do app. Para incluir um novo destino, acrescente um item aqui;
 * a barra lateral se ajusta sozinha.
 */
export function navLinks(userId?: Id | null): NavLink[] {
  return [
    { label: 'Início', icon: 'home', path: '/home' },
    { label: 'Explorar', icon: 'compass', path: '/home', query: { vista: 'todos' } },
    ...(userId ? [{ label: 'Meu perfil', icon: 'user' as const, path: ['/perfil', userId] }] : []),
    { label: 'Minha conta', icon: 'settings', path: '/conta' },
  ];
}
