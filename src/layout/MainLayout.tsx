import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Home } from 'lucide-react';
import { useHeaderStore } from '../store/useHeaderStore'; // Import the Zustand store

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { headerTitle } = useHeaderStore(); // Get headerTitle from Zustand store

    const [showBackButton, setShowBackButton] = React.useState(false);

    React.useEffect(() => {
        // Show back button for any path not being the home page
        setShowBackButton(location.pathname !== '/');
    }, [location.pathname]);

    const handleBack = () => {
        navigate(-1); // Go back one step in history
    };

    const handleHome = () => {
        navigate('/'); // Go to the home page
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Back button, Logo/Title, and Home button */}
                        <div className="flex items-center space-x-3">
                            {showBackButton && (
                                <button onClick={handleBack} className="p-2 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <ArrowLeft className="h-6 w-6 text-neutral-700" />
                                </button>
                            )}
                            <div className="bg-primary-600 p-2 rounded-xl shadow-sm">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-neutral-900">{headerTitle}</h1>
                                <p className="text-xs text-neutral-600 hidden sm:block">Sistema de Evaluación Docente</p>
                            </div>
                        </div>

                        {/* Connection status and Home button */}
                        <div className="flex items-center space-x-4">
                            {/* Home button */}
                            {location.pathname !== '/' && (
                                <button onClick={handleHome} className="p-2 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <Home className="h-6 w-6 text-neutral-700" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-neutral-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
                    <div className="flex justify-between items-center space-y-3 sm:space-y-0">
                        {/* Información de la app */}
                        <div className="flex items-center space-x-3">
                            <p className="text-sm text-neutral-600">©2025 Evaluación Docente</p>
                        </div>
                        <div className="">
                            <span className='text-neutral-500 text-xs'>IndexedDB</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
