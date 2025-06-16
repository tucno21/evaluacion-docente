import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Calendar, X, School, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { Classroom } from '../types/types';
import ModalAlert from '../components/ModalAlert';
import Inputs from '../components/Inputs'; // Import Inputs component
import Button from '../components/Button';

const HomePage = () => {
    const navigate = useNavigate();
    const { classrooms, loadClassrooms, addNewClassroom, deleteClassroom } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [classroomToDeleteId, setClassroomToDeleteId] = useState<string | null>(null);
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
        e.stopPropagation();
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
        <div className="min-h-full space-y-6">
            {/* Header compacto */}
            <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">
                    Mis Aulas
                </h2>
                <p className="text-sm sm:text-base text-neutral-600">
                    Gestiona tus aulas y evaluaciones
                </p>
            </div>


            {/* Lista de aulas */}
            {classrooms.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                    <div className="bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <School className="h-8 w-8 sm:h-10 sm:w-10 text-neutral-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                        Sin aulas creadas
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-600 mb-6 max-w-sm mx-auto px-4">
                        Crea tu primera aula para comenzar a gestionar estudiantes
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {classrooms.map((classroom) => (
                        <div
                            key={classroom.id}
                            className="bg-white rounded-xl border border-neutral-200 hover:border-primary-300 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
                            onClick={() => goToGrade(classroom.id)}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    {/* Contenido principal */}
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        {/* Icono y badge */}
                                        <div className="relative">
                                            <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-2.5 rounded-lg">
                                                <BookOpen className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                {classroom.grade}{classroom.section}
                                            </div>
                                        </div>

                                        {/* Información */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-neutral-900 truncate text-base sm:text-lg">
                                                {classroom.name} <span>{classroom.grade}{classroom.section}</span>
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center text-xs text-neutral-500">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    <span className="hidden sm:inline">
                                                        {new Date(classroom.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="sm:hidden">
                                                        {new Date(classroom.createdAt).toLocaleDateString('es', {
                                                            day: '2-digit',
                                                            month: 'short'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={(e) => handleDeleteClassroom(e, classroom.id)}
                                            className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                                            aria-label="Eliminar aula"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Botón flotante optimizado para móvil */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200 active:scale-95"
                aria-label="Crear nueva aula"
            >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Modal mejorado */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">
                                    Nueva Aula
                                </h2>
                                <p className="text-sm text-neutral-600 mt-1">
                                    Completa la información básica
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario */}
                        <div className="p-6 space-y-5">
                            {/* Nombre del aula */}
                            <Inputs
                                label="Nombre del Aula"
                                id="classroomName"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Ej: Matemáticas 1°A"
                                error={errors.name}
                                inputClassName="focus:ring-primary-500"
                            />

                            {/* Grado y Sección en fila */}
                            <div className="grid grid-cols-2 gap-4">
                                <Inputs
                                    label="Grado"
                                    id="classroomGrade"
                                    type="number"
                                    value={formData.grade}
                                    onChange={(e) => handleInputChange('grade', e.target.value)}
                                    placeholder="Ej: 1"
                                    min="1"
                                    max="6"
                                    error={errors.grade}
                                    inputClassName="focus:ring-primary-500"
                                />

                                <Inputs
                                    label="Sección"
                                    id="classroomSection"
                                    type="text"
                                    value={formData.section}
                                    onChange={(e) => handleInputChange('section', e.target.value)}
                                    placeholder="Ej: A"
                                    maxLength={1}
                                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                        e.currentTarget.value = e.currentTarget.value.toUpperCase();
                                        handleInputChange('section', e.currentTarget.value);
                                    }}
                                    error={errors.section}
                                    inputClassName="focus:ring-primary-500"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={closeModal}
                                    variant="neutral"
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="flex-1"
                                >
                                    Crear Aula
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Alerta */}
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
