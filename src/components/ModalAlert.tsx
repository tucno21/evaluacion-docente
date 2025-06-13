import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalAlertProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

const ModalAlert: React.FC<ModalAlertProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                {/* Header del modal */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                    <h2 className="text-xl font-semibold text-neutral-900">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Contenido del modal */}
                <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-error-500" />
                    </div>
                    <p className="text-neutral-700 mb-6">{message}</p>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAlert;
