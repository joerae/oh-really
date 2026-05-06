import React from 'react';

interface SkepticismMeterProps {
  score: number;
}

const SkepticismMeter: React.FC<SkepticismMeterProps> = ({ score }) => {
  // Determine color based on score
  let strokeColor = '#22c55e'; // Green
  let textColor = 'text-green-600';
  let label = 'Likely True';
  
  if (score > 30 && score <= 70) {
    strokeColor = '#f59e0b'; // Amber
    textColor = 'text-amber-600';
    label = 'Debatable';
  } else if (score > 70) {
    strokeColor = '#ef4444'; // Red
    textColor = 'text-red-600';
    label = 'Likely False';
  }

  // Circular progress calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Score Text in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black ${textColor}`}>
            {score}
          </span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Skepticism</span>
        </div>
      </div>
      
      <div className={`text-xl font-bold mt-2 ${textColor}`}>{label}</div>
    </div>
  );
};

export default SkepticismMeter;