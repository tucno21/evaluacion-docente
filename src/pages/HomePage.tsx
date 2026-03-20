import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Calendar, X, School, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getAllGradeSections } from '../utils/indexDB';
import type { Classroom, GradeSection } from '../types/types';
import ModalAlert from '../components/ModalAlert';
import Button from '../components/Button';
import Select from '../components/Select';

const SUBJECT_OPTIONS = [
    { value: '', label: 'Seleccione un área' },
    { value: 'Matemática', label: 'Matemática' },
    { value: 'Comunicación', label: 'Comunicación' },
    { value: 'Inglés', label: 'Inglés' },
    { value: 'Arte y Cultura', label: 'Arte y Cultura' },
    { value: 'Ciencias Sociales', label: 'Ciencias Sociales' },
    { value: 'Desarrollo Personal, Ciudadanía y Cívica', label: 'Desarrollo Personal, Ciudadanía y Cívica' },
    { value: 'Educación Física', label: 'Educación Física' },
    { value: 'Educación Religiosa', label: 'Educación Religiosa' },
    { value: 'Ciencia y Tecnología', label: 'Ciencia y Tecnología' },
    { value: 'Educación para el Trabajo', label: 'Educación para el Trabajo' },
    { value: 'Quechua', label: 'Quechua' }
];

const HomePage = () => {
    const navigate = useNavigate();
    const { classrooms, loadClassrooms, addNewClassroom, deleteClassroom, loadAllStudents, students } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [classroomToDeleteId, setClassroomToDeleteId] = useState<string | null>(null);
    const [showNoStudentsModal, setShowNoStudentsModal] = useState(false);
    const [gradeSections, setGradeSections] = useState<GradeSection[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        gradeSectionId: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Helper function para obtener el nombre del GradeSection
    const getGradeSectionName = (gradeSectionId: string) => {
        const gradeSection = gradeSections.find(gs => gs.id === gradeSectionId);
        return gradeSection ? gradeSection.name : '';
    };

    // Validaciones
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre del aula es obligatorio';
        }

        if (!formData.gradeSectionId.trim()) {
            newErrors.gradeSectionId = 'El grado y sección son obligatorios';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) return;

        const newClassroom: Omit<Classroom, 'id'> = {
            name: formData.name.trim(),
            gradeSectionId: formData.gradeSectionId.trim(),
            createdAt: new Date().toISOString()
        };

        const id = await addNewClassroom(newClassroom);
        if (id) {
            setFormData({ name: '', gradeSectionId: '' });
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
        setFormData({ name: '', gradeSectionId: '' });
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
        loadAllStudents();
        getAllGradeSections().then(setGradeSections);
    }, [loadClassrooms, loadAllStudents]);

    return (
        <div className="min-h-full space-y-6">
            {/* Header compacto */}
            <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-dark-text-primary mb-1">
                    Mis Aulas
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
                    Gestiona tus aulas y evaluaciones
                </p>
            </div>


            {/* Lista de aulas */}
            {classrooms.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                    <div className="bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <School className="h-8 w-8 sm:h-10 sm:w-10 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-dark-text-primary mb-2">
                        Sin aulas creadas
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary mb-6 max-w-sm mx-auto px-4">
                        Crea tu primera aula para comenzar a gestionar estudiantes
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {classrooms.map((classroom) => (
                        <div
                            key={classroom.id}
                            className="bg-bg-card dark:bg-dark-bg-card rounded-xl border border-neutral-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
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
                                                {getGradeSectionName(classroom.gradeSectionId)}
                                            </div>
                                        </div>

                                        {/* Información */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-neutral-900 dark:text-dark-text-primary truncate text-base sm:text-lg">
                                                {classroom.name} <span>{getGradeSectionName(classroom.gradeSectionId)}</span>
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center text-xs text-neutral-500 dark:text-dark-text-secondary">
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
                                            className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/50 rounded-lg transition-all duration-200"
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
                onClick={() => {
                    if (students.length === 0) {
                        setShowNoStudentsModal(true);
                    } else {
                        setIsModalOpen(true);
                    }
                }}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200 active:scale-95"
                aria-label="Crear nueva aula"
            >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Modal mejorado */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-bg-card dark:bg-dark-bg-card rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-dark-border">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text-primary">
                                    Nueva Aula
                                </h2>
                                <p className="text-sm text-neutral-600 dark:text-dark-text-secondary mt-1">
                                    Completa la información básica
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario */}
                        <div className="p-6 space-y-5">
                            {/* Nombre del aula */}
                            <Select
                                label="Nombre del Aula"
                                id="classroomName"
                                options={SUBJECT_OPTIONS}
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                error={errors.name}
                                selectClassName="focus:ring-primary-500"
                            />

                            {/* Grado y Sección */}
                            <Select
                                label="Grado y Sección"
                                id="classroomGradeSection"
                                options={[
                                    { value: '', label: 'Seleccione un grado y sección' },
                                    ...gradeSections.map(gs => ({ value: gs.id, label: gs.name }))
                                ]}
                                value={formData.gradeSectionId}
                                onChange={(e) => handleInputChange('gradeSectionId', e.target.value)}
                                error={errors.gradeSectionId}
                                selectClassName="focus:ring-primary-500"
                            />

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

            {/* Modal de advertencia - No hay estudiantes */}
            {showNoStudentsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-bg-card dark:bg-dark-bg-card rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-dark-border">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text-primary">
                                    No hay estudiantes registrados
                                </h2>
                                <p className="text-sm text-neutral-600 dark:text-dark-text-secondary mt-1">
                                    Primero debes registrar estudiantes antes de crear un aula
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNoStudentsModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        <div className="p-6 space-y-5">
                            <div className="bg-info-50 dark:bg-info-700/50 border border-info-100 dark:border-info-700 rounded-lg p-4">
                                <p className="text-sm text-info-800 dark:text-info-300">
                                    Para comenzar a evaluar, primero necesitas registrar estudiantes en el sistema. Puedes hacerlo importando desde un archivo Excel o registrándolos manualmente.
                                </p>
                            </div>

                            {/* Botones */}
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => setShowNoStudentsModal(false)}
                                    variant="neutral"
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowNoStudentsModal(false);
                                        navigate('/students');
                                    }}
                                    className="flex-1"
                                >
                                    Ir a Estudiantes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
