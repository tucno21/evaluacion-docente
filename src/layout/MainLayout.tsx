import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Home, DatabaseBackup } from 'lucide-react';
import { useHeaderStore } from '../store/useHeaderStore';

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { headerTitle, setHeaderTitle } = useHeaderStore();

    const [showBackButton, setShowBackButton] = React.useState(false);

    React.useEffect(() => {
        setShowBackButton(location.pathname !== '/');
        if (location.pathname === '/') {
            setHeaderTitle('Evalúa Docente'); // Reset to default title
        }
    }, [location.pathname, setHeaderTitle]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleHome = () => {
        navigate('/');
    };

    const handleConfig = () => {
        navigate('/config');
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            {/* Header Profesional */}
            <header className="bg-gradient-to-r from-primary-800 to-primary-700 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 sm:h-18">
                        {/* Sección izquierda - Logo y navegación */}
                        <div className="flex items-center space-x-3">
                            {showBackButton && (
                                <button
                                    onClick={handleBack}
                                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    aria-label="Volver"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </button>
                            )}

                            {/* Logo y título */}
                            <div className="flex items-center space-x-3">
                                {location.pathname === '/' && (
                                    <div className="bg-white/15 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
                                        <BookOpen className="h-6 w-6 text-white" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                                        {headerTitle}
                                    </h1>
                                    <p className="text-xs text-white/80 hidden sm:block font-medium">
                                        Sistema de Evaluación Docente
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sección derecha - Acciones */}
                        <div className="flex items-center space-x-2">
                            {/* Botón Home */}
                            {location.pathname !== '/' && (
                                <button
                                    onClick={handleHome}
                                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    aria-label="Inicio"
                                    title="Volver al inicio"
                                >
                                    <Home className="h-5 w-5 text-white" />
                                </button>
                            )}
                            {/* Botón para backup */}
                            {location.pathname === '/' && (
                                <button
                                    onClick={handleConfig}
                                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    aria-label="Configuración"
                                    title="Copias de seguridad y restauración"
                                >
                                    <DatabaseBackup className="h-5 w-5 text-white" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Barra de progreso sutil */}
                <div className="h-0.5 bg-gradient-to-r from-white/20 via-white/40 to-white/20"></div>
            </header>

            {/* Contenido principal */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-6 sm:py-4">
                <div className="py-4 sm:p-4">
                    <Outlet />
                </div>
            </main>

            {/* Footer profesional */}
            <footer className="bg-white border-t border-neutral-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                        {/* Información de la app */}
                        <div className="flex items-center space-x-4">
                            <p className="text-sm text-neutral-600 font-medium">
                                © 2025 Evaluación Docente
                            </p>
                            <div className="h-4 w-px bg-neutral-300"></div>
                            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                                v1.0
                            </span>
                        </div>

                        {/* Estado de almacenamiento */}
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-neutral-500 font-medium">
                                IndexedDB Conectado
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
