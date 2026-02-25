import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Check your email for a password reset link. It may take a few minutes.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
          <Link to="/auth" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
