import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Calendar, Settings, BarChart3, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

const featureData = {
  calendar: {
    title: 'Calendar & Scheduling',
    description: 'Plan your outreach campaigns with precision using our advanced scheduling tools.',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-400',
    image: '/illustrations/calendar-illustration.svg',
    features: [
      'Visual campaign scheduling',
      'Time zone optimization',
      'Smart sending times',
      'Conflict prevention'
    ]
  },
  settings: {
    title: 'Advanced Settings',
    description: 'Customize every aspect of your outreach experience with powerful configuration options.',
    icon: Settings,
    color: 'from-purple-500 to-indigo-500',
    image: '/illustrations/settings-illustration.svg',
    features: [
      'Account preferences',
      'Security settings',
      'API integrations',
      'Notification controls'
    ]
  },
  analytics: {
    title: 'Advanced Analytics',
    description: 'Gain deep insights into your campaign performance with comprehensive analytics tools.',
    icon: BarChart3,
    color: 'from-amber-400 to-orange-500',
    image: '/illustrations/analytics-illustration.svg',
    features: [
      'Performance dashboards',
      'Custom reporting',
      'Trend analysis',
      'ROI tracking'
    ]
  },
  dashboard: {
    title: 'Executive Dashboard',
    description: 'Get a bird\'s-eye view of all your campaign activities and results in one place.',
    icon: LayoutDashboard,
    color: 'from-green-400 to-emerald-500',
    image: '/illustrations/dashboard-illustration.svg',
    features: [
      'Activity summaries',
      'Key performance metrics',
      'Team productivity stats',
      'Goal tracking'
    ]
  }
};

// Fallback image in case the SVG paths aren't available
const illustrationFallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwMCAyNTBjODIuODQgMCAxNTAtNTAuOCAxNTAtMTEzLjRTMjgyLjg0IDIzLjIgMjAwIDIzLjIgNTAgNzQgNTAgMTM2LjZzNjcuMTYgMTEzLjQgMTUwIDExMy40eiIgZmlsbD0iI2YzZjRmNiIvPjxwYXRoIGQ9Ik0xOTYgMjIzYzU3LjQzOCAwIDEwNC00Ni41NjIgMTA0LTEwNFMyNTMuNDM4IDE1IDE5NiAxNSA5MiA2MS41NjIgOTIgMTE5czQ2LjU2MiAxMDQgMTA0IDEwNHoiIGZpbGw9IiNmOWZhZmIiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE3My41NDggMTI0LjcyOGMyLjc4MiA1LjU2NCA3LjYzMSA5LjY1NSAxMy41NTIgMTAuNjc1TDEzNS44ODMgMTg3LjAzYy01LjkyMS0xLjAyLTExLjM5NS00LjIyMS0xNS4yNS05LjEyNS0zLjg1NS00LjkwMy01LjkyMS0xMC44MTUtNS42NDUtMTYuNzI4bDUxLjIxNy01MS43NzNjMi4yMjYgNi4wMiA0LjU2NyAxMC44MTUgNy4zNDMgMTUuMzI0eiIgZmlsbD0iIzY0NzQ4YiIvPjxjaXJjbGUgY3g9IjIxMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiM4ODk0YjAiLz48cGF0aCBkPSJNMjI5IDgzaC0zOHYzNGgzOFY4M3oiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjExIDk5aC0ydi0xMGgydjEwem0wIDZoLTJ2LTNoMnYzeiIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==';

const ComingSoonContent = () => {
  const { feature } = useParams<{feature: string}>();
  const location = useLocation();
  const [currentFeature, setCurrentFeature] = useState('dashboard');

  // Determine which feature to display based on URL path
  useEffect(() => {
    // First check the dynamic route parameter
    if (feature && featureData[feature as keyof typeof featureData]) {
      setCurrentFeature(feature);
    } 
    // Then check for direct routes like /calendar, /analytics, etc.
    else {
      const path = location.pathname.substring(1); // Remove leading slash
      if (featureData[path as keyof typeof featureData]) {
        setCurrentFeature(path);
      } else {
        setCurrentFeature('dashboard'); // Default
      }
    }
  }, [feature, location.pathname]);

  const data = featureData[currentFeature as keyof typeof featureData];
  const Icon = data.icon;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        {/* Back Button - reduced margin */}
        <Link to="/allcampaigns">
          <Button variant="ghost" className="mb-3 flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
        
        {/* Content layout restructured to use flex */}
        <div className="flex flex-col md:flex-row gap-6 items-center bg-white rounded-xl shadow-xl border border-gray-100 p-5 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${data.color}`}></div>
          <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${data.color} opacity-20 blur-md`}></div>
          <div className={`absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-gradient-to-tr ${data.color} opacity-20 blur-md`}></div>
          
          {/* Left side: Illustration */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br ${data.color} opacity-20 blur-lg`}></div>
            </div>
            <img 
              src={data.image} 
              alt={data.title}
              className="w-40 h-40 md:w-48 md:h-48 relative z-10"
              onError={(e) => {
                // Fallback if the image fails to load
                (e.target as HTMLImageElement).src = illustrationFallback;
              }}
            />
          </div>
          
          {/* Right side: Content */}
          <div className="flex-1 flex flex-col h-full text-left">
            {/* Icon & Title */}
            <div className="flex items-center mb-3">
              <div className={`p-3 rounded-full bg-gradient-to-br ${data.color} text-white mr-3`}>
                <Icon size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
                <div className="text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text uppercase tracking-wider">
                  Coming Soon
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">
              {data.description}
            </p>
            
            {/* Feature Grid - made more compact */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {data.features.map((feature, index) => (
                <div key={index} className="flex items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${data.color} mr-2`}></div>
                  <span className="text-xs text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            
            {/* Timeline - made more compact */}
            <div className="mb-4">
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${data.color} w-7/12`}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Development</span>
                <span>Testing</span>
                <span>Launch</span>
              </div>
            </div>
            
            {/* Notification Button */}
            <Button className={`bg-gradient-to-r ${data.color} hover:opacity-90 text-white w-full py-1.5 h-auto text-sm`}>
              Get notified when launched
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComingSoon = () => {
  const { feature } = useParams<{feature: string}>();
  const location = useLocation();
  
  // Determine which feature to use for the active sidebar
  let activePage = 'dashboard';
  if (feature) {
    activePage = feature;
  } else {
    const path = location.pathname.substring(1);
    if (Object.keys(featureData).includes(path)) {
      activePage = path;
    }
  }
  
  return (
    <DashboardLayout activePage={activePage}>
      <ComingSoonContent />
    </DashboardLayout>
  );
};

export default ComingSoon;