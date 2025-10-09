import React from "react";
import Button from "../components/Button";
import { Utensils, Star, TrendingUp, Shield } from "lucide-react";
import { LocalLogger } from "../utils/LocalLogger";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  const [showEffects, setShowEffects] = React.useState(false);

  React.useEffect(() => {
    // Delay heavy effects to avoid GPU allocation issues
    const timer = setTimeout(() => {
      setShowEffects(true);
      LocalLogger.log("WelcomeScreen effects loaded");
    }, 100); // 100ms delay
    return () => clearTimeout(timer);
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Log button click
  const handleStart = () => {
    LocalLogger.log("User clicked Start Managing Now");
    onGetStarted();
  };

  return (
    <div className="px-6 py-8 min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#2A2119] dark:via-[#3D2F21] dark:to-[#4D3B2A] flex flex-col items-center justify-center relative overflow-hidden">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }
          .transition-hover { transition: all 0.3s ease; }
          .hover\\:scale-105:hover { transform: scale(1.05); }
        `}
      </style>

      {/* Grid overlay background */}
      {showEffects && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
          <div className="absolute inset-0 bg-[length:50px_50px] bg-[linear-gradient(to_right,gray_1px,transparent_1px),linear-gradient(to_bottom,gray_1px,transparent_1px)]"></div>
        </div>
      )}

      <div className="w-full max-w-sm mx-auto text-center relative z-10">
        {/* Emoji Card */}
        {showEffects && (
          <div className="mb-8 animate-fade-in">
            <div className="relative mx-auto w-36 h-36 mb-6 transition-hover hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl shadow-2xl"></div>
              <div className="absolute inset-4 bg-white/10 rounded-2xl backdrop-blur-sm"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl">🍜</span>
              </div>
              <Star className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400" fill="currentColor" />
              <Star className="absolute -bottom-2 -left-2 w-5 h-5 text-orange-300" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Title & Features */}
        <div className="mb-8 animate-fade-in delay-100">
          <div className="flex items-center justify-center mb-4">
            <Utensils size={36} className="mr-3 text-orange-500 dark:text-orange-400" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 leading-tight">
              Food Stall Pro Manager
            </h1>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4 px-2">
            Run your food stall smarter — track orders, sales, stock, and daily cash without internet.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm transition-hover hover:scale-105">
              <TrendingUp size={20} className="text-green-600 mb-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Sales Track</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm transition-hover hover:scale-105">
              <Shield size={20} className="text-blue-600 mb-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Offline Safe</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm transition-hover hover:scale-105">
              <Star size={20} className="text-purple-600 mb-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Easy Use</span>
            </div>
          </div>

          {/* Clock Card */}
          {showEffects && (
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 backdrop-blur-sm animate-fade-in delay-200">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {currentTime} • {currentDate}
              </p>
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="space-y-4 animate-fade-in delay-300">
          <Button
            size="lg"
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl px-8 py-4 hover:scale-105 active:scale-95"
            icon="🚀"
          >
            Start Managing Now
          </Button>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Offline-first • Secure • Free Forever</span>
          </div>
        </div>

        <div className="mt-8 animate-fade-in delay-400">
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Designed for food stall owners who need reliable, offline-first business management
          </p>
        </div>
      </div>

      {/* Bottom gradient overlay */}
      {showEffects && (
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/50 dark:from-[#2A2119]/50 to-transparent pointer-events-none"></div>
      )}
    </div>
  );
};

export default WelcomeScreen;
