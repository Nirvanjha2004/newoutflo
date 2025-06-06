
import React from 'react';
import SignupForm from '@/components/SignUpPage/SignUpForm';
import { Users } from 'lucide-react';

const SignupPage = () => {
  return (
    <div className="min-h-screen bg-purple-light flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Illustration/Content */}
          <div className="hidden lg:block text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-primary/10 rounded-full mb-8">
              <Users className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-primary">OutFlo</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Streamline your outreach and connect with your audience like never before.
            </p>
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Easy LinkedIn integration</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Centralized conversation management</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Smart campaign automation</span>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome to <span className="text-primary">OutFlo</span>
                </h1>
              </div>
              
              <SignupForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
