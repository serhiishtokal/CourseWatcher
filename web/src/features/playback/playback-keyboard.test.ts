import { describe, expect, it } from 'vitest';
import { isEditableTarget } from './playback-keyboard';

describe('isEditableTarget', () => {
  it('returns true for form fields and false for regular elements', () => {
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true);
    expect(isEditableTarget(document.createElement('input'))).toBe(true);
    expect(isEditableTarget(document.createElement('div'))).toBe(false);
  });
});
