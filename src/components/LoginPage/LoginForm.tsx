
import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { useUserAccessTokens } from '@/hooks/useAuthenticationMutations';

const LoginForm = () => {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: postAccessTokens, isLoading } = useUserAccessTokens();

  const [submitError, setSubmitError] = useState(false);
  const [submitErrorText, setSubmitErrorText] = useState("");

  const showPasswordHandler = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setDomain(e.target.value + "_domain");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handlePasswordKeypress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Enter") {
      handleLogin(e);
      return;
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    postAccessTokens(
      { domain, username, password },
      {
        onSuccess: () => {
          navigate("/inbox");
        },
        onError: () => {
          setSubmitErrorText("Incorrect username or password");
          setSubmitError(true);
        },
      },
    );
  };
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back to OutFlo
        </h2>
        <p className="text-gray-600">
          Welcome back to your dashboard
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="username"
              name="username"
              type="username"
              placeholder="Enter your username"
              value={username}
              onChange={handleUsernameChange}
              className="pl-10 py-3 rounded-xl border-gray-200 focus:border-primary focus:ring-primary placeholder:text-purple-200"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              className="pl-10 py-3 rounded-xl border-gray-200 focus:border-primary focus:ring-primary placeholder:text-purple-200"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium text-base"
        >
          Log In
        </Button>
      </form>

      {/* Toggle Link */}
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Don't have an account?
          <Link
            to="/signup"
            className="text-primary hover:text-primary/80 font-medium ml-1"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
