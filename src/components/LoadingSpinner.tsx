import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    isOpen: boolean; // New prop to control visibility
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Cargando...',
    size = 'md',
    color = 'text-primary-500',
    isOpen
}) => {
    if (!isOpen) return null;

    const spinnerSize = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    }[size];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
                <Loader2 className={`${spinnerSize} ${color} animate-spin`} />
                {message && <p className="mt-2 text-sm text-neutral-600">{message}</p>}
            </div>
        </div>
    );
};

export default LoadingSpinner;
