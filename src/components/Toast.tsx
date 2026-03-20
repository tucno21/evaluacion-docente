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

const toastKeyframes = `
@keyframes toast-progress {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
}
@keyframes toast-in-top {
    from { opacity: 0; transform: translateY(-8px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
}
@keyframes toast-in-bottom {
    from { opacity: 0; transform: translateY(8px)  scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
@keyframes toast-out {
    from { opacity: 1; transform: scale(1);    }
    to   { opacity: 0; transform: scale(0.95); }
}
`;

let styleInjected = false;
function injectStyles() {
    if (styleInjected || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.textContent = toastKeyframes;
    document.head.appendChild(el);
    styleInjected = true;
}

const Toast: React.FC<ToastProps> = ({
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
    onAction,
}) => {
    const [isLeaving, setIsLeaving] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const remainingRef = useRef(duration);
    const startedAtRef = useRef(Date.now());

    injectStyles();

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(onClose, 180);
    }, [onClose]);

    const startTimer = useCallback((ms: number) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        startedAtRef.current = Date.now();
        timerRef.current = setTimeout(handleClose, ms);
    }, [handleClose]);

    useEffect(() => {
        if (persistent) return;
        startTimer(remainingRef.current);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [persistent, startTimer]);

    const pauseTimer = useCallback(() => {
        if (persistent || isPaused) return;
        setIsPaused(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        remainingRef.current -= Date.now() - startedAtRef.current;
    }, [persistent, isPaused]);

    const resumeTimer = useCallback(() => {
        if (persistent || !isPaused) return;
        setIsPaused(false);
        startTimer(remainingRef.current);
    }, [persistent, isPaused, startTimer]);

    const isTop = position.includes('top');

    const positionStyle: React.CSSProperties = (() => {
        const base: React.CSSProperties = { position: 'fixed', zIndex: 50 };
        if (position === 'top-right') return { ...base, top: 16, right: 16 };
        if (position === 'top-left') return { ...base, top: 16, left: 16 };
        if (position === 'bottom-right') return { ...base, bottom: 16, right: 16 };
        if (position === 'bottom-left') return { ...base, bottom: 16, left: 16 };
        if (position === 'top-center') return { ...base, top: 16, left: '50%', transform: 'translateX(-50%)' };
        return { ...base, bottom: 16, left: '50%', transform: 'translateX(-50%)' };
    })();

    const typeStyles = {
        success: {
            container: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/50 dark:border-green-800 dark:text-green-200',
            icon: 'text-green-600 dark:text-green-400',
            progress: '#22c55e',
            closeHover: 'hover:bg-green-100 dark:hover:bg-green-800',
        },
        error: {
            container: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/50 dark:border-red-800 dark:text-red-200',
            icon: 'text-red-600 dark:text-red-400',
            progress: '#ef4444',
            closeHover: 'hover:bg-red-100 dark:hover:bg-red-800',
        },
        warning: {
            container: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-200',
            icon: 'text-amber-600 dark:text-amber-400',
            progress: '#f59e0b',
            closeHover: 'hover:bg-amber-100 dark:hover:bg-amber-800',
        },
        info: {
            container: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200',
            icon: 'text-blue-600 dark:text-blue-400',
            progress: '#3b82f6',
            closeHover: 'hover:bg-blue-100 dark:hover:bg-blue-800',
        },
    };

    const getIcon = () => {
        const cls = `h-5 w-5 ${typeStyles[type].icon} flex-shrink-0`;
        switch (type) {
            case 'success': return <CheckCircle className={cls} aria-hidden />;
            case 'error': return <XCircle className={cls} aria-hidden />;
            case 'warning': return <AlertTriangle className={cls} aria-hidden />;
            case 'info': return <Info className={cls} aria-hidden />;
            default: return <AlertCircle className={cls} aria-hidden />;
        }
    };

    const animationName = isLeaving
        ? 'toast-out'
        : isTop ? 'toast-in-top' : 'toast-in-bottom';

    const wrapperAnimation: React.CSSProperties = {
        animation: `${animationName} 180ms ease-out forwards`,
        minWidth: 320,
        maxWidth: 448,
    };

    // Progress bar: pure CSS animation — no JS interval, no re-renders
    const progressStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        transformOrigin: 'left center',
        backgroundColor: typeStyles[type].progress,
        animation: `toast-progress ${duration}ms linear forwards`,
        animationPlayState: isPaused ? 'paused' : 'running',
        willChange: 'transform',
    };

    return (
        <div style={{ ...positionStyle, ...wrapperAnimation }} role="alert" aria-live="polite">
            <div
                className={`relative overflow-hidden rounded-lg border shadow-lg ${typeStyles[type].container} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
                onMouseEnter={pauseTimer}
                onMouseLeave={resumeTimer}
                onClick={onClick}
            >
                {showProgress && !persistent && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.08)' }}>
                        <div style={progressStyle} />
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
                                    onClick={(e) => { e.stopPropagation(); onAction(); }}
                                    className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                                >
                                    {actionLabel}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleClose(); }}
                            className={`p-1 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current ${typeStyles[type].closeHover}`}
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