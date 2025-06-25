import React from 'react';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, onChange, options, className }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // Basic styling - users should replace this
      className={`border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ''}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};
