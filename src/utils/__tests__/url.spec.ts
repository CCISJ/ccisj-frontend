// Estos dos helpers arman enlaces con datos que carga otro usuario (el
// archivo de un CV, el teléfono de un postulante). Vue escapa el texto, pero
// no el `href`: un `javascript:` ahí se ejecuta al hacer clic.
//
// Los `javascript:` de abajo son los ataques que se prueban, no código que
// se ejecute: por eso se apaga esta regla en este archivo.
/* oxlint-disable no-script-url */
import { describe, expect, it } from 'vitest';

import { safeHttpsUrl, telHref } from '@/utils/url';

describe('safeHttpsUrl', () => {
  it('deja pasar una URL https absoluta', () => {
    expect(safeHttpsUrl('https://storage.example.com/cv.pdf?token=abc')).toBe(
      'https://storage.example.com/cv.pdf?token=abc',
    );
  });

  it.each([
    'javascript:alert(document.cookie)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'http://storage.example.com/cv.pdf',
    '//evil.example.com/cv.pdf',
    '/cvs/cv.pdf',
    'cv.pdf',
    '',
    null,
    undefined,
  ])('rechaza %j', (value) => {
    expect(safeHttpsUrl(value)).toBeNull();
  });
});

describe('telHref', () => {
  it.each([
    ['099 123 456', 'tel:099123456'],
    ['+598 99 123 456', 'tel:+59899123456'],
    ['(4342) 2345', 'tel:43422345'],
  ])('%j → %j', (value, href) => {
    expect(telHref(value)).toBe(href);
  });

  it.each([
    // Lo que no es dígito se descarta, así que no puede cambiar el esquema
    // del enlace ni agregarle parámetros.
    ['099javascript:alert(1)', 'tel:0991'],
    ['099?x=1&y=2', 'tel:09912'],
  ])('%j solo conserva los dígitos', (value, href) => {
    expect(telHref(value)).toBe(href);
  });

  it.each(['', 'sin teléfono', '12', '++', null, undefined])(
    'sin un número, ningún enlace: %j',
    (value) => {
      expect(telHref(value)).toBeNull();
    },
  );
});
