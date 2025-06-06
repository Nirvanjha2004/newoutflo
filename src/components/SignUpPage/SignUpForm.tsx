
import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { useSignup, useUserAccessTokens } from '@/hooks/useAuthenticationMutations';

const SignupForm = () => {


    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [domain, setDomain] = useState("");

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { mutate: postAccessTokens, isLoading: isAccessTokenLoading } = useUserAccessTokens();
    const { mutate: postFormData, isLoading: isSignupLoading } = useSignup();

    const [submitError, setSubmitError] = useState(false);
    const [submitErrorText, setSubmitErrorText] = useState("");

    const showPasswordHandler = () => {
        setShowPassword((prevState) => !prevState);
    };

    const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFullName(e.target.value);
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
            handleSignup();
            return;
        }
    };

    const handleSignup = () => {
        postFormData(
            { name: fullName, email: username, password },
            {
                onSuccess: () => {
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
                },
                onError: () => {
                    setSubmitErrorText("Failed to create an account. Please try again.");
                    setSubmitError(true);
                },
            },
        );

    };
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Join OutFlo
                </h2>
                <p className="text-gray-600">
                    Join OutFlo to streamline your outreach
                </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        Full Name
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={handleFullNameChange}
                            className="pl-10 py-3 rounded-xl border-gray-200 focus:border-primary focus:ring-primary placeholder:text-purple-200"
                            required
                        />
                    </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        Username
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Choose a username"
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
                            onKeyDown={handlePasswordKeypress}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium text-base"
                >
                    Create Account
                </Button>
            </form>

            {/* Toggle Link */}
            <div className="text-center mt-6">
                <p className="text-gray-600">
                    Already have an account?
                    <Link
                        to="/login"
                        className="text-primary hover:text-primary/80 font-medium ml-1"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupForm;
