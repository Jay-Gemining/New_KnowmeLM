import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'default'; // Add other variants as needed
  size?: 'sm' | 'default' | 'lg'; // Add other sizes as needed
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    // Basic styling - users should replace this with their actual button styles
    const baseStyle = "font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantStyle = variant === 'outline' ? "border border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-blue-500 text-white hover:bg-blue-600";
    const sizeStyle = size === 'sm' ? "px-3 py-1.5 text-xs" : size === 'lg' ? "px-6 py-3 text-lg" : "px-4 py-2 text-sm";

    return (
      <button
        className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
