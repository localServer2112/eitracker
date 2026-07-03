import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
      const FREEZER_API_BASE = import.meta.env.VITE_FREEZER_API_BASE || '/freezer-api/v1';

      const [vehicleResult, freezerResult] = await Promise.allSettled([
        fetch(`${API_BASE}/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }),
        fetch(`${FREEZER_API_BASE}/auth/token/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }),
      ]);

      if (vehicleResult.status === 'rejected') throw new Error('Cannot reach the server. Please try again.');
      const vehicleRes = vehicleResult.value;
      if (!vehicleRes.ok) throw new Error('Invalid credentials');

      const vehicleData = await vehicleRes.json();
      const vehicleToken = vehicleData.token || vehicleData.key;
      if (!vehicleToken) throw new Error('No token returned by the API');

      let freezerToken = null;
      if (freezerResult.status === 'fulfilled' && freezerResult.value.ok) {
        const freezerData = await freezerResult.value.json().catch(() => null);
        freezerToken = freezerData?.token || freezerData?.key || null;
      }

      onLogin(vehicleToken, freezerToken);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 flex-col gap-4">
      <Card className="w-full max-w-sm border-[#1a1a1a]/10">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight text-[#1a1a1a]">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the realtime tracker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="focus-visible:ring-[#1a1a1a]"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-visible:ring-[#1a1a1a]"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm font-medium">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
