import React from 'react';

type ButtonVariant = 'primary' | 'accent' | 'green' | 'info' | 'neutral' | 'danger' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    children: React.ReactNode;
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    ...props
}) => {
    let baseClasses = "flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm shadow-md hover:shadow-lg active:scale-95";
    let variantClasses = "";

    switch (variant) {
        case 'primary':
            variantClasses = "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white";
            break;
        case 'accent':
            variantClasses = "bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white";
            break;
        case 'green':
            variantClasses = "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white";
            break;
        case 'info':
            variantClasses = "bg-gradient-to-r from-info-600 to-info-700 hover:from-info-700 hover:to-info-800 text-white";
            break;
        case 'neutral':
            baseClasses = "flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm"; // Neutral buttons often don't have shadow
            variantClasses = "bg-neutral-200 hover:bg-neutral-300 text-neutral-700";
            break;
        case 'danger':
            baseClasses = "p-2 rounded-lg transition-all duration-200"; // Danger/icon buttons have different padding
            variantClasses = "text-neutral-400 hover:text-error-600 hover:bg-error-50";
            break;
        case 'outline':
            baseClasses = "w-full px-3 py-2 md:px-4 md:py-3 border-2 border-dashed rounded-xl transition-all flex items-center justify-center space-x-2";
            variantClasses = "border-neutral-300 text-neutral-600 hover:border-accent-300 hover:text-accent-600 hover:bg-accent-50";
            break;
        default:
            variantClasses = "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white";
            break;
    }

    return (
        <button
            className={`${baseClasses} ${variantClasses} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
