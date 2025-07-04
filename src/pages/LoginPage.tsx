import React from 'react';
import AuthForm from '@/components/LoginPage/LoginForm';
import { Users } from 'lucide-react';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[#edecfe] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">

        
        <div className="grid lg:grid-cols-2 gap-12 items-center">


          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5a41cd]/10 rounded-full mb-4">
                  <Users className="w-8 h-8 text-[#5a41cd]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome to <span className="text-[#5a41cd]">OutFlo</span>
                </h1>
              </div>
              
              <AuthForm />
            </div>
          </div>
          {/* Left Side - Illustration/Content */}
          <div className="hidden lg:block text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-[#5a41cd]/10 rounded-full mb-8">
              <img src='image.png' className="w-32 h-32 text-[#5a41cd]" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-[#5a41cd]">OutFlo</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Streamline your outreach and connect with your audience like never before.
            </p>
            {/* <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-[#5a41cd] rounded-full"></div>
                <span>Easy LinkedIn integration</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-[#5a41cd] rounded-full"></div>
                <span>Centralized conversation management</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-[#5a41cd] rounded-full"></div>
                <span>Smart campaign automation</span>
              </div>
            </div> */}
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
