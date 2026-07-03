import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import Login from './Login';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText('Username'), {
    target: { value: 'admin' },
  });
  fireEvent.change(screen.getByPlaceholderText('Password'), {
    target: { value: 'password123' },
  });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('Login', () => {
  it('calls onLogin with both tokens when both APIs succeed', async () => {
    server.use(
      http.post('*/auth/login/', () => HttpResponse.json({ token: 'vehicle-token' })),
      http.post('*/auth/token/', () => HttpResponse.json({ token: 'freezer-token' }))
    );

    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('vehicle-token', 'freezer-token', null);
    });
  });

  it('still logs in with a null freezer token and an error reason when the freezer API has a network-level failure', async () => {
    server.use(
      http.post('*/auth/login/', () => HttpResponse.json({ token: 'vehicle-token' })),
      http.post('*/auth/token/', () => HttpResponse.error())
    );

    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('vehicle-token', null, 'Cannot reach the freezer server');
    });
  });

  it('logs in with vehicle token and a credentials error reason when the freezer API rejects the login', async () => {
    server.use(
      http.post('*/auth/login/', () => HttpResponse.json({ token: 'vehicle-token' })),
      http.post('*/auth/token/', () => new HttpResponse(null, { status: 400 }))
    );

    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(
        'vehicle-token',
        null,
        'Freezer login failed — check your credentials'
      );
    });
  });

  it('shows an "Invalid credentials" error and does not call onLogin when the vehicle API returns 401', async () => {
    server.use(
      http.post('*/auth/login/', () => new HttpResponse(null, { status: 401 })),
      http.post('*/auth/token/', () => HttpResponse.json({ token: 'freezer-token' }))
    );

    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    expect(onLogin).not.toHaveBeenCalled();
  });
});
