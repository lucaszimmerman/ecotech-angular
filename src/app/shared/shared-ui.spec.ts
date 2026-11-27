import { TestBed } from '@angular/core/testing';
import { CharCountComponent } from './char-count.component';
import { IconComponent } from './icon.component';
import { navLinks } from './nav-links';

describe('controles compartilhados', () => {
  it('mostra "Meu perfil" só com usuário logado', () => {
    expect(navLinks().map((link) => link.label)).toEqual(['Início', 'Explorar', 'Minha conta']);
    expect(navLinks('abc').find((link) => link.label === 'Meu perfil')?.path).toEqual(['/perfil', 'abc']);
  });

  it('contador avisa o mínimo e destaca perto do limite', () => {
    TestBed.configureTestingModule({ declarations: [CharCountComponent] });
    const fixture = TestBed.createComponent(CharCountComponent);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('min', 5);
    fixture.componentRef.setInput('value', 'oi');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3 restantes');

    fixture.componentRef.setInput('value', 'abcdefghij');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('10/10');
    expect(fixture.nativeElement.querySelector('.char-count-limit')).not.toBeNull();
  });

  it('ícone renderiza SVG decorativo', () => {
    TestBed.configureTestingModule({ declarations: [IconComponent] });
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'heart');
    fixture.componentRef.setInput('filled', true);
    fixture.detectChanges();
    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });
});

describe('ImageDraft', () => {
  it('mantém a prévia só para o tipo escolhido e limpa ao cancelar', async () => {
    const { ImageDraft } = await import('./image-draft');
    const draft = new ImageDraft<'profile' | 'cover'>();
    draft.set('cover', new File(['x'], 'capa.png', { type: 'image/png' }));
    expect(draft.previewFor('cover')).toMatch(/^blob:/);
    expect(draft.previewFor('profile')).toBeNull();
    draft.clear();
    expect(draft.kind).toBeNull();
    expect(draft.preview).toBe('');
  });
});
