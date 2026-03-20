import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Home, DatabaseBackup, HelpCircle, Sun, Moon, Users } from 'lucide-react';
import { useHeaderStore } from '../store/useHeaderStore';

const MainLayout = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const location = useLocation();
    const navigate = useNavigate();
    const { headerTitle, setHeaderTitle } = useHeaderStore();

    const [showBackButton, setShowBackButton] = React.useState(false);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

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

    const handleHelp = () => {
        navigate('/help');
    };

    const handleStudents = () => {
        // If on grade page, navigate to students page for that classroom
        const match = location.pathname.match(/\/grade\/([^\/]+)/);
        if (match && match[1]) {
            navigate(`/grade/${match[1]}/students`);
        } else {
            // If on home page, navigate to all students page
            navigate('/students');
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="min-h-screen bg-bg-soft dark:bg-dark-bg-soft flex flex-col text-neutral-800 dark:text-dark-text-primary">
            {/* Header Profesional */}
            <header className="bg-gradient-to-r from-primary-800 to-primary-700 shadow-lg sticky top-0 z-50 dark:from-primary-900 dark:to-primary-800">
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
                            {/* Botón Estudiantes - Visible en HomePage */}
                            {location.pathname === '/' && (
                                <button
                                    onClick={handleStudents}
                                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    aria-label="Estudiantes"
                                    title="Ver todos los estudiantes"
                                >
                                    <Users className="h-5 w-5 text-white" />
                                </button>
                            )}
                            {/* Botón para backup */}
                            {location.pathname === '/' && (
                                <>
                                    <button
                                        onClick={handleConfig}
                                        className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                                        aria-label="Configuración"
                                        title="Copias de seguridad y restauración"
                                    >
                                        <DatabaseBackup className="h-5 w-5 text-white" />
                                    </button>
                                    <button
                                        onClick={handleHelp}
                                        className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                                        aria-label="Ayuda"
                                        title="Página de Ayuda"
                                    >
                                        <HelpCircle className="h-5 w-5 text-white" />
                                    </button>
                                </>
                            )}
                            {/* Botón para cambiar tema */}
                            {location.pathname === '/' && (
                                <button
                                    onClick={toggleTheme}
                                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    aria-label="Cambiar tema"
                                    title="Cambiar tema"
                                >
                                    {theme === 'light' ? (
                                        <Moon className="h-5 w-5 text-white" />
                                    ) : (
                                        <Sun className="h-5 w-5 text-white" />
                                    )}
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
            <footer className="bg-white dark:bg-dark-bg-card border-t border-neutral-200 dark:border-dark-border mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                        {/* Información de la app */}
                        <div className="flex items-center space-x-4">
                            <p className="text-sm text-neutral-600 dark:text-dark-text-secondary font-medium">
                                © {new Date().getFullYear()} Evaluación Docente
                            </p>
                            <div className="h-4 w-px bg-neutral-300 dark:bg-dark-border"></div>
                            <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-full">
                                v1.5
                            </span>
                        </div>

                        {/* Estado de almacenamiento */}
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-neutral-500 dark:text-dark-text-secondary font-medium">
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
