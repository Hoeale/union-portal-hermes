import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { apiClient } from './api-client';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should make GET request and return data', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as unknown as Response);

      const result = await apiClient.get('/api/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test');
    });

    it('should throw error for failed GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      } as unknown as Response);

      await expect(apiClient.get('/api/test')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('post', () => {
    it('should make POST request with CSRF token', async () => {
      const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
      const csrfToken = 'test-csrf-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      const result = await apiClient.post('/api/test', { name: 'Test' }, { csrfToken });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ name: 'Test' }),
      });
    });

    it('should make POST request without CSRF token', async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      await apiClient.post('/api/test', { name: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      });
    });

    it('should throw error for failed POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
      } as unknown as Response);

      await expect(
        apiClient.post('/api/test', { name: 'Test' })
      ).rejects.toThrow('Bad request');
    });
  });

  describe('put', () => {
    it('should make PUT request with CSRF token', async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      const csrfToken = 'test-csrf-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      const result = await apiClient.put('/api/test', { name: 'Updated' }, { csrfToken });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ name: 'Updated' }),
      });
    });
  });

  describe('delete', () => {
    it('should make DELETE request with CSRF token', async () => {
      const mockResponse = { success: true };
      const csrfToken = 'test-csrf-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      const result = await apiClient.delete('/api/test?id=1', { csrfToken });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/test?id=1', {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/api/test')).rejects.toThrow('Network error');
    });
  });
});
