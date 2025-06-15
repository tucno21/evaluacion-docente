import React from 'react';

interface InputsProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string; // Made optional
    id: string;
    error?: string;
    containerClassName?: string;
    labelClassName?: string;
    inputClassName?: string;
}

const Inputs: React.FC<InputsProps> = ({
    label,
    id,
    error,
    containerClassName = '',
    labelClassName = 'block text-sm font-semibold text-neutral-700 mb-1',
    inputClassName = '',
    ...props
}) => {
    const defaultInputClasses = `w-full px-3 py-2 md:px-4 md:py-3 border rounded-xl focus:outline-none focus:ring focus:ring-accent-500 focus:border-transparent transition-all ${error ? 'border-error-500' : 'border-neutral-200 hover:border-neutral-400'
        }`;

    return (
        <div className={containerClassName}>
            <label htmlFor={id} className={labelClassName}>
                {label}
            </label>
            <input
                id={id}
                className={`${defaultInputClasses} ${inputClassName}`}
                {...props}
            />
            {error && (
                <p className="text-error-600 text-xs flex items-center">
                    <span className="w-1 h-1 bg-error-600 rounded-full mr-2"></span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default Inputs;
