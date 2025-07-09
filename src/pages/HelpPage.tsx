import React, { useEffect } from 'react';
import { useHeaderStore } from '../store/useHeaderStore';
import { BookOpen, UserPlus, Edit, FileDown, Upload, Settings } from 'lucide-react';

const HelpPage: React.FC = () => {
    const { setHeaderTitle } = useHeaderStore();

    useEffect(() => {
        setHeaderTitle('Página de Ayuda');
    }, [setHeaderTitle]);

    const features = [
        {
            icon: <BookOpen className="w-8 h-8 text-primary-600" />,
            title: '1. Gestión de Clases',
            description: 'En la página principal, puedes crear nuevas clases con el boton en la esquina inferior derecha "+". Puedes el nombre del área, grado y sección. Cada clase es un contenedor para tus estudiantes y sus evaluaciones. luego de crearla, Haz clic en una clase para ver sus detalles.',
        },
        {
            icon: <UserPlus className="w-8 h-8 text-primary-600" />,
            title: '2. Añadir Estudiantes',
            description: 'Primero, debes agregar estudiantes a una clase. Para ello, puedes importar una lista desde un archivo Excel. Te recomendamos descargar previamente un archivo de ejemplo o plantilla para facilitar el proceso. Asegúrate de que el archivo excel contenga una columna denominada "nombreCompleto".',
        },
        {
            icon: <Edit className="w-8 h-8 text-primary-600" />,
            title: '3. Crear y Usar Matrices de Evaluación',
            description: 'Crea matrices de evaluación personalizadas para cada clase para ello click en el boton en la esquina inferior derecha "+", agrega el nombre de la matriz y los criterios de evaluación. Luego, podrás usar estas matrices para calificar a tus estudiantes. "PT" significa participación y puedes dar clic y cambia de "F", "C", "B", "B+", "A", "A+ para calificar la participación de un estudiante. "F" significa que falto a la clase',
        },
        {
            icon: <FileDown className="w-8 h-8 text-primary-600" />,
            title: '4. Exportar Datos',
            description: 'En la página de una clase, encontrarás opciones para exportar las notas y evaluaciones a un archivo de Excel. Esto es útil para mantener registros o compartir la información, que puede ser por matrriz o por fechas de todas las matrices de la clase.',
        },
        {
            icon: <Settings className="w-8 h-8 text-primary-600" />,
            title: '5. Copia de Seguridad',
            description: 'En la página principal, haz clic en el icono para acceder a las opciones de copia de seguridad. Puedes descargar un archivo con todos tus datos de la aplicación. Este archivo es un respaldo completo que incluye todas las clases, estudiantes y evaluaciones.',
        },
        {
            icon: <Upload className="w-8 h-8 text-primary-600" />,
            title: '6. Restaurar Copia de Seguridad',
            description: 'En la misma página de configuración, puedes restaurar tus datos desde un archivo de respaldo. IMPORTANTE: Esta opción solo está disponible si no tienes ninguna clase creada en la aplicación para evitar la sobreescritura accidental de datos.',
        },
    ];

    return (
        <div className="p-4 md:p-6 bg-gray-50">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Guía Rápida de Uso</h1>
            <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
                {features.map((feature, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            {feature.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">{feature.title}</h2>
                            <p className="text-gray-600">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center mt-12">
                <p className="text-gray-600">
                    ¿Tienes más preguntas? Contacta con el soporte o revisa la documentación completa.
                </p>
            </div>
        </div>
    );
};

export default HelpPage;
