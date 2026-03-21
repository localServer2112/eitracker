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
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://your-domain.com/api/v1';
      
      const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      if (data.token || data.key) {
        onLogin(data.token || data.key);
      } else {
        throw new Error('No token configuration returned by the API');
      }
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
