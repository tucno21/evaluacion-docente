import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/Button';
import { useHeaderStore } from '../store/useHeaderStore';
import Toast from '../components/Toast';

const ConfigPage: React.FC = () => {
    const { backupData, restoreData, checkDataExists, loading, error } = useAppStore();
    const [isRestoreDisabled, setIsRestoreDisabled] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [toastInfo, setToastInfo] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { setHeaderTitle } = useHeaderStore();

    useEffect(() => {
        setHeaderTitle('Configuración y Respaldo');
    }, [setHeaderTitle]);


    useEffect(() => {
        const checkExistingData = async () => {
            const exists = await checkDataExists();
            setIsRestoreDisabled(exists);
        };
        checkExistingData();
    }, [checkDataExists]);

    const handleBackup = async () => {
        await backupData();
        setToastInfo({ message: 'Copia de seguridad creada exitosamente.', type: 'success' });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.type === 'application/json') {
                setSelectedFile(file);
                setToastInfo(null);
            } else {
                setToastInfo({ message: 'Por favor, selecciona un archivo JSON válido.', type: 'error' });
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) {
            setToastInfo({ message: 'Por favor, selecciona un archivo para restaurar.', type: 'error' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const data = JSON.parse(text);
                    await restoreData(data);
                    setToastInfo({ message: 'Base de datos restaurada exitosamente. La página se recargará.', type: 'success' });
                    setTimeout(() => window.location.reload(), 2000);
                }
            } catch (err) {
                setToastInfo({ message: 'Error al procesar el archivo de respaldo.', type: 'error' });
            }
        };
        reader.readAsText(selectedFile);
    };

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Gestión de Datos</h1>

            {toastInfo && (
                <Toast
                    message={toastInfo.message}
                    type={toastInfo.type}
                    onClose={() => setToastInfo(null)}
                />
            )}

            {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-300 p-3 rounded-md mb-4">Error: {error}</div>}

            <div className="bg-white dark:bg-dark-bg-card shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-2">Crear Copia de Seguridad</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Guarda todos los datos de la aplicación (clases, estudiantes, evaluaciones) en un archivo JSON.
                    Conserva este archivo en un lugar seguro.
                </p>
                <Button onClick={handleBackup} disabled={loading}>
                    {loading ? 'Generando...' : 'Descargar Copia de Seguridad'}
                </Button>
            </div>

            <div className="bg-white dark:bg-dark-bg-card shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-2">Restaurar desde Copia de Seguridad</h2>
                {isRestoreDisabled ? (
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 p-4" role="alert">
                        <p className="font-bold">Función Deshabilitada</p>
                        <p>
                            La restauración solo está permitida si no existen datos en la aplicación.
                            Para restaurar, primero debes eliminar todas las clases existentes.
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Selecciona un archivo de respaldo (JSON) para restaurar los datos.
                            <span className="font-bold text-red-600 dark:text-red-400"> Advertencia:</span> Esta acción sobreescribirá todos los datos actuales.
                        </p>
                        <div className="flex items-center space-x-4">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"
                                ref={fileInputRef}
                            />
                            <Button onClick={handleRestore} disabled={!selectedFile || loading}>
                                {loading ? 'Restaurando...' : 'Restaurar Datos'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfigPage;
