import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastProps {
    id?: string;
    message: string;
    type: ToastType;
    title?: string;
    duration?: number;
    position?: ToastPosition;
    persistent?: boolean;
    showProgress?: boolean;
    onClose: () => void;
    onClick?: () => void;
    actionLabel?: string;
    onAction?: () => void;
}

const Toast: React.FC<ToastProps> = ({
    id,
    message,
    type,
    title,
    duration = 5000,
    position = 'top-right',
    persistent = false,
    showProgress = true,
    onClose,
    onClick,
    actionLabel,
    onAction
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);

    const timerRef = useRef<number | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const remainingTimeRef = useRef<number>(duration);

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose();
        }, 100);
    }, [onClose]);

    const startTimer = useCallback(() => {
        if (persistent) return;

        startTimeRef.current = Date.now();

        timerRef.current = setTimeout(() => {
            handleClose();
        }, remainingTimeRef.current);

        if (showProgress) {
            progressIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                const remaining = Math.max(0, remainingTimeRef.current - elapsed);
                const progressValue = (remaining / duration) * 100;

                setProgress(progressValue);

                if (remaining <= 0) {
                    clearInterval(progressIntervalRef.current!);
                }
            }, 16);
        }
    }, [persistent, duration, showProgress, handleClose]);

    const pauseTimer = useCallback(() => {
        if (persistent || isPaused) return;

        setIsPaused(true);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            const elapsed = Date.now() - startTimeRef.current;
            remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        }

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
    }, [persistent, isPaused]);

    const resumeTimer = useCallback(() => {
        if (persistent || !isPaused) return;

        setIsPaused(false);
        startTimer();
    }, [persistent, isPaused, startTimer]);

    useEffect(() => {
        setIsVisible(true);
        startTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [startTimer]);

    const positionClasses = {
        'top-right': 'top-4 right-4 sm:right-4 sm:left-auto left-1/2 -translate-x-1/2 sm:translate-x-0',
        'top-left': 'top-4 left-4 sm:left-4 sm:right-auto right-1/2 translate-x-1/2 sm:translate-x-0',
        'bottom-right': 'bottom-4 right-4 sm:right-4 sm:left-auto left-1/2 -translate-x-1/2 sm:translate-x-0',
        'bottom-left': 'bottom-4 left-4 sm:left-4 sm:right-auto right-1/2 translate-x-1/2 sm:translate-x-0',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
    };

    const typeStyles = {
        success: {
            container: 'bg-green-50 border-green-200 text-green-900',
            icon: 'text-green-600',
            progress: 'bg-green-500',
            closeHover: 'hover:bg-green-100'
        },
        error: {
            container: 'bg-red-50 border-red-200 text-red-900',
            icon: 'text-red-600',
            progress: 'bg-red-500',
            closeHover: 'hover:bg-red-100'
        },
        warning: {
            container: 'bg-amber-50 border-amber-200 text-amber-900',
            icon: 'text-amber-600',
            progress: 'bg-amber-500',
            closeHover: 'hover:bg-amber-100'
        },
        info: {
            container: 'bg-blue-50 border-blue-200 text-blue-900',
            icon: 'text-blue-600',
            progress: 'bg-blue-500',
            closeHover: 'hover:bg-blue-100'
        }
    };

    const getIcon = () => {
        const iconProps = {
            className: `h-5 w-5 ${typeStyles[type].icon} flex-shrink-0`,
            'aria-hidden': true
        };

        switch (type) {
            case 'success':
                return <CheckCircle {...iconProps} />;
            case 'error':
                return <XCircle {...iconProps} />;
            case 'warning':
                return <AlertTriangle {...iconProps} />;
            case 'info':
                return <Info {...iconProps} />;
            default:
                return <AlertCircle {...iconProps} />;
        }
    };

    const handleContainerClick = () => {
        if (onClick) {
            onClick();
        }
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAction) {
            onAction();
        }
    };

    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleClose();
    };

    return (
        <div
            id={id}
            className={`
                fixed z-50 min-w-80 sm:max-w-md
                ${positionClasses[position]}
                transform transition-all duration-200 ease-out
                ${isVisible && !isLeaving
                    ? 'translate-y-0 opacity-100 scale-100'
                    : position.includes('top')
                        ? '-translate-y-2 opacity-0 scale-95'
                        : 'translate-y-2 opacity-0 scale-95'
                }
            `}
            role="alert"
            aria-live="polite"
            onMouseEnter={pauseTimer}
            onMouseLeave={resumeTimer}
            onClick={onClick ? handleContainerClick : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className={`
                relative overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm
                ${typeStyles[type].container}
                ${onClick ? 'hover:shadow-xl transition-shadow' : ''}
            `}>
                {/* Progress bar */}
                {showProgress && !persistent && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10">
                        <div
                            className={`h-full transition-all duration-75 ease-linear ${typeStyles[type].progress}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                <div className="p-2 md:p-4">
                    <div className="flex space-x-2 md:space-x-3 items-center">
                        {getIcon()}

                        <div className="flex-1 min-w-0">
                            {title && (
                                <h4 className="text-xs md:text-sm font-semibold mb-1 leading-tight">
                                    {title}
                                </h4>
                            )}
                            <p className="text-xs md:text-sm leading-relaxed break-words">
                                {message}
                            </p>

                            {actionLabel && onAction && (
                                <button
                                    onClick={handleActionClick}
                                    className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                                >
                                    {actionLabel}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleCloseClick}
                            className={`
                                p-1 rounded-md transition-colors duration-150 focus:outline-none 
                                focus:ring-2 focus:ring-offset-2 focus:ring-current
                                ${typeStyles[type].closeHover}
                            `}
                            aria-label="Cerrar notificación"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toast;
