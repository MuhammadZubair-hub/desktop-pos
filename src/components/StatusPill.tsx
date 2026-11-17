import React from 'react';

interface StatusPillProps {
  status: 'online' | 'offline' | 'warning' | 'info';
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, sublabel, icon }) => {
  const colorMap = {
    online: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
    offline: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
    warning: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
    info: 'bg-blue-950/80 border-blue-500/40 text-blue-300',
  };

  const dotColor = {
    online: 'bg-emerald-400 animate-pulse',
    offline: 'bg-rose-400',
    warning: 'bg-amber-400 animate-pulse',
    info: 'bg-blue-400',
  };

  return (
    <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full border text-xs font-medium ${colorMap[status]}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor[status]}`} />
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{label}</span>
      {sublabel && <span className="text-[10px] opacity-70 border-l border-current/20 pl-1.5">{sublabel}</span>}
    </div>
  );
};
