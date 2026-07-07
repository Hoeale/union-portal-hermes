import { renderHook, act } from '@testing-library/react';
import { useCsrfToken } from './useCsrfToken';

// Mock fetch
global.fetch = jest.fn();

describe('useCsrfToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return CSRF token', async () => {
    const mockToken = 'test-csrf-token-123';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: mockToken }),
    });

    const { result } = renderHook(() => useCsrfToken());

    // Initially empty
    expect(result.current).toBe('');

    // Wait for fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have the token
    expect(result.current).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/csrf-token');
  });

  it('should handle fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCsrfToken());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should remain empty on error
    expect(result.current).toBe('');
  });

  it('should handle missing token in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useCsrfToken());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should remain empty if no token
    expect(result.current).toBe('');
  });
});
