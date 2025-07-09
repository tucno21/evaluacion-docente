import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
    options: SelectOption[];
    error?: string;
    containerClassName?: string;
    labelClassName?: string;
    selectClassName?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    id,
    options,
    error,
    containerClassName = '',
    labelClassName = 'block text-sm font-semibold text-neutral-700 dark:text-dark-text-secondary mb-2',
    selectClassName = '',
    ...props
}) => {
    const defaultSelectClasses = `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-dark-bg-card text-neutral-800 dark:text-dark-text-primary ${error ? 'border-error-500' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-400 dark:hover:border-neutral-600'
        }`;

    return (
        <div className={containerClassName}>
            <label htmlFor={id} className={labelClassName}>
                {label}
            </label>
            <select
                id={id}
                className={`${defaultSelectClasses} ${selectClassName}`}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-white dark:bg-dark-bg-card text-neutral-800 dark:text-dark-text-primary">
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-error-600 text-sm mt-2 flex items-center">
                    <span className="w-1 h-1 bg-error-600 rounded-full mr-2"></span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default Select;
