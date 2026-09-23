import React from 'react';
import { Target, Check } from 'lucide-react';
import { ROLES } from '../../mock/setup';

interface RoleSelectorProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center">
          <Target className="w-4 h-4 stroke-[2.5]" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Target Role</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {ROLES.map((role) => {
          const isSelected = selectedRole === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onSelectRole(role)}
              className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isSelected
                  ? 'border-[#FF6B00] bg-orange-50/80 text-[#FF6B00] shadow-xs ring-1 ring-orange-500/20'
                  : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-[#FF6B00] stroke-[3]" />}
              <span>{role}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
