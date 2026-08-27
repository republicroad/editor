import { describe, expect, test } from 'bun:test';
import { errorMessage, isUserAbort } from '../error-message';

describe('isUserAbort', () => {
  test('DOMException AbortError → true', () => {
    expect(isUserAbort(new DOMException('The user aborted a request.', 'AbortError'))).toBe(true);
  });

  test('其他 DOMException(如 NotAllowedError) → false', () => {
    expect(isUserAbort(new DOMException('denied', 'NotAllowedError'))).toBe(false);
  });

  test('普通 Error / null / undefined → false', () => {
    expect(isUserAbort(new Error('boom'))).toBe(false);
    expect(isUserAbort(null)).toBe(false);
    expect(isUserAbort(undefined)).toBe(false);
  });
});

describe('errorMessage', () => {
  test('Error 取 message', () => {
    expect(errorMessage(new Error('oops'))).toBe('oops');
  });
});
