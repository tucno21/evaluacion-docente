import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, Calendar, X, School, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { Classroom } from '../types/types';
import ModalAlert from '../components/ModalAlert'; // Importar el nuevo componente

const HomePage = () => {
    const navigate = useNavigate();
    const { classrooms, loadClassrooms, addNewClassroom, deleteClassroom } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Estado para el modal de eliminación
    const [classroomToDeleteId, setClassroomToDeleteId] = useState<string | null>(null); // ID del aula a eliminar
    const [formData, setFormData] = useState({
        name: '',
        grade: '',
        section: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validaciones
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre del aula es obligatorio';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }

        if (!formData.grade.trim()) {
            newErrors.grade = 'El grado es obligatorio';
        } else if (isNaN(Number(formData.grade)) || Number(formData.grade) < 1 || Number(formData.grade) > 6) {
            newErrors.grade = 'El grado debe ser un número del 1 al 6';
        }

        if (!formData.section.trim()) {
            newErrors.section = 'La sección es obligatoria';
        } else if (!/^[A-Z]$/.test(formData.section.trim().toUpperCase())) {
            newErrors.section = 'La sección debe ser una letra (A-Z)';
        }

        // Verificar si ya existe un aula con el mismo grado y sección
        const exists = classrooms.some(
            classroom =>
                classroom.grade === formData.grade.trim() &&
                classroom.section.toLowerCase() === formData.section.trim().toLowerCase()
        );

        if (exists) {
            newErrors.grade = 'Ya existe un aula con este grado y sección';
            newErrors.section = 'Ya existe un aula con este grado y sección';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) return;

        const newClassroom: Omit<Classroom, 'id'> = {
            name: formData.name.trim(),
            grade: formData.grade.trim(),
            section: formData.section.trim().toUpperCase(),
            createdAt: new Date().toISOString()
        };

        const id = await addNewClassroom(newClassroom);
        if (id) {
            setFormData({ name: '', grade: '', section: '' });
            setErrors({});
            setIsModalOpen(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando el usuario empieza a escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', grade: '', section: '' });
        setErrors({});
    };

    const goToGrade = (classroomId: string) => {
        navigate(`/grade/${classroomId}`);
    };

    const handleDeleteClassroom = (e: React.MouseEvent, classroomId: string) => {
        e.stopPropagation(); // Evitar que se dispare goToGrade
        setClassroomToDeleteId(classroomId);
        setShowDeleteModal(true);
    };

    const confirmDeleteClassroom = async () => {
        if (classroomToDeleteId) {
            await deleteClassroom(classroomToDeleteId);
            setShowDeleteModal(false);
            setClassroomToDeleteId(null);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setClassroomToDeleteId(null);
    };

    useEffect(() => {
        loadClassrooms();
    }, [loadClassrooms]);

    return (
        <div className="min-h-full">
            {/* Header de bienvenida */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    Bienvenido a EvaluApp
                </h1>
                <p className="text-neutral-600">
                    Gestiona tus aulas y evaluaciones de manera eficiente
                </p>
            </div>

            {/* Lista de aulas */}
            {classrooms.length === 0 ? (
                <div className="text-center py-16">
                    <div className="bg-neutral-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <School className="h-10 w-10 text-neutral-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                        No tienes aulas creadas
                    </h3>
                    <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                        Comienza creando tu primera aula para gestionar estudiantes y evaluaciones
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map((classroom) => (
                        <div
                            key={classroom.id}
                            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                            onClick={() => goToGrade(classroom.id)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary-100 p-3 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteClassroom(e, classroom.id)}
                                        className="text-neutral-400 hover:text-error-600 transition-colors p-2 rounded-full hover:bg-neutral-100"
                                        aria-label="Eliminar aula"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <span className="bg-accent-100 text-accent-700 text-xs font-medium px-2 py-1 rounded-full">
                                        {classroom.grade}° {classroom.section}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                {classroom.name}
                            </h3>

                            <div className="flex items-center text-sm text-neutral-600 mb-4">
                                <Users className="h-4 w-4 mr-2" />
                                <span>Grado {classroom.grade} - Sección {classroom.section}</span>
                            </div>

                            <div className="flex items-center text-xs text-neutral-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Creado el {new Date(classroom.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Botón flotante para crear aula */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200"
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Modal para crear aula */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-semibold text-neutral-900">
                                Crear Nueva Aula
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario */}
                        <div className="p-6 space-y-4">
                            {/* Nombre del aula */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Nombre del Aula *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.name ? 'border-error-500' : 'border-neutral-300'
                                        }`}
                                    placeholder="Ej: Aula de Matemáticas"
                                />
                                {errors.name && (
                                    <p className="text-error-600 text-sm mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Grado */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Grado *
                                </label>
                                <input
                                    type="number"
                                    value={formData.grade}
                                    onChange={(e) => handleInputChange('grade', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.grade ? 'border-error-500' : 'border-neutral-300'
                                        }`}
                                    placeholder="Ej: 1"
                                    min="1"
                                    max="6"
                                />
                                {errors.grade && (
                                    <p className="text-error-600 text-sm mt-1">{errors.grade}</p>
                                )}
                            </div>

                            {/* Sección */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Sección *
                                </label>
                                <input
                                    type="text"
                                    value={formData.section}
                                    onChange={(e) => handleInputChange('section', e.target.value.toUpperCase())}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.section ? 'border-error-500' : 'border-neutral-300'
                                        }`}
                                    placeholder="A"
                                    maxLength={1}
                                />
                                {errors.section && (
                                    <p className="text-error-600 text-sm mt-1">{errors.section}</p>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                                >
                                    Crear Aula
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Alerta para Eliminación */}
            <ModalAlert
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={confirmDeleteClassroom}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta aula? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default HomePage;
