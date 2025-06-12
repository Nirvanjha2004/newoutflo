import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
          Welcome back to <span className="text-[#5a41cd]">OutFlo</span>
        </h2>
        <p className="text-gray-600">
          Sign in to continue to your dashboard
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-[#5a41cd]" />
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={handleUsernameChange}
              className="pl-10 py-3 rounded-xl border-[#5a41cd]/20 focus:border-[#5a41cd] focus:ring-[#5a41cd] bg-white"
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
            <Lock className="absolute left-3 top-3 h-5 w-5 text-[#5a41cd]" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              className="pl-10 pr-10 py-3 rounded-xl border-[#5a41cd]/20 focus:border-[#5a41cd] focus:ring-[#5a41cd] bg-white"
              required
              onKeyDown={handlePasswordKeypress}
            />
            <button
              type="button"
              onClick={showPasswordHandler}
              className="absolute right-3 top-3 text-[#5a41cd] hover:text-[#5a41cd]/80"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="text-red-500 text-sm font-medium">
            {submitErrorText}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full py-3 bg-[#5a41cd] hover:bg-[#5a41cd]/90 text-white rounded-xl font-medium text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Logging in...</span>
            </div>
          ) : (
            "Log In"
          )}
        </Button>
      </form>

      {/* Toggle Link */}
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Don't have an account?
          <Link
            to="/signup"
            className="text-[#5a41cd] hover:text-[#5a41cd]/80 font-medium ml-1"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
