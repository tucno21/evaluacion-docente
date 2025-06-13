import { useState, useEffect } from 'react';
import { Users, Plus, Calendar, ClipboardList, X, Trash2, BookOpen, Pencil } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useHeaderStore } from '../store/useHeaderStore'; // Import useHeaderStore
import type { EvaluationMatrix, EvaluationCriterion } from '../types/types';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import { getClassroomById } from '../utils/indexDB'; // Import getClassroomById

const GradePage = () => {
    const { gradeId } = useParams<{ gradeId: string }>();
    const navigate = useNavigate();
    const { evaluationMatrices, loadMatricesByClassroom, addNewEvaluationMatrix, updateExistingMatrix, removeMatrix } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMatrixId, setEditingMatrixId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        date: ''
    });
    const [criteria, setCriteria] = useState<EvaluationCriterion[]>([
        { id: uuidv4(), name: '' } // Use uuid for initial criterion ID
    ]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    // Validaciones
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre de la evaluación es obligatorio';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }

        if (!formData.date) {
            newErrors.date = 'La fecha es obligatoria';
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.date = 'La fecha no puede ser anterior a hoy';
            }
        }

        // Validar criterios
        const validCriteria: EvaluationCriterion[] = criteria.filter(c => c.name.trim() !== '');
        if (validCriteria.length === 0) {
            newErrors.criteria = 'Debe agregar al menos un criterio de evaluación';
        } else {
            const duplicates = validCriteria.some((criterion, index) =>
                validCriteria.findIndex(c => c.name.trim().toLowerCase() === criterion.name.trim().toLowerCase()) !== index
            );
            if (duplicates) {
                newErrors.criteria = 'No puede haber criterios duplicados';
            }
        }

        // Verificar criterios vacíos
        const hasEmptyCriteria = criteria.some(c => c.name.trim() === '' && criteria.length > 1);
        if (hasEmptyCriteria) {
            newErrors.criteria = 'Complete todos los criterios o elimine los vacíos';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const validCriteria: EvaluationCriterion[] = criteria.filter(c => c.name.trim() !== '');

        if (editingMatrixId) {
            // Update existing matrix
            const updatedMatrix: EvaluationMatrix = {
                id: editingMatrixId,
                classroomId: gradeId!,
                name: formData.name.trim(),
                date: formData.date,
                criteria: validCriteria.map((c: EvaluationCriterion) => ({ id: c.id!, name: c.name.trim() })),
            };
            await updateExistingMatrix(updatedMatrix);
        } else {
            // Add new matrix
            const newMatrix: Omit<EvaluationMatrix, 'id'> = {
                classroomId: gradeId!,
                name: formData.name.trim(),
                date: formData.date,
                criteria: validCriteria.map((c: EvaluationCriterion) => ({ id: c.id!, name: c.name.trim() })),
            };
            await addNewEvaluationMatrix(newMatrix);
        }
        closeModal();
        loadMatricesByClassroom(gradeId!); // Reload matrices after add/update
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMatrixId(null); // Reset editing state
        setFormData({ name: '', date: '' });
        setCriteria([{ id: uuidv4(), name: '' }]);
        setErrors({});
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCriteriaChange = (id: string, value: string) => {
        setCriteria(prev => prev.map(c =>
            c.id === id ? { ...c, name: value } : c
        ));
        if (errors.criteria) {
            setErrors(prev => ({ ...prev, criteria: '' }));
        }
    };

    const addCriteria = () => {
        if (criteria.length < 5) {
            setCriteria(prev => [...prev, { id: uuidv4(), name: '' }]); // Use uuid for new criterion ID
        }
    };

    const removeCriteria = (id: string) => {
        if (criteria.length > 1) {
            setCriteria(prev => prev.filter(c => c.id !== id));
        }
    };

    const goToStudents = () => {
        navigate(`/grade/${gradeId}/students`);
    };

    const handleDeleteMatrix = async (matrixId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta matriz de evaluación?')) {
            await removeMatrix(matrixId);
            loadMatricesByClassroom(gradeId!); // Reload matrices after deletion
        }
    };

    const handleEditMatrix = (matrixId: string) => {
        const matrixToEdit = evaluationMatrices.find(matrix => matrix.id === matrixId);
        if (matrixToEdit) {
            setEditingMatrixId(matrixId);
            setFormData({
                name: matrixToEdit.name,
                date: matrixToEdit.date
            });
            setCriteria(matrixToEdit.criteria.map(c => ({ ...c }))); // Deep copy criteria
            setIsModalOpen(true);
        }
    };

    const goToEvaluation = (matrixId: string) => {
        navigate(`/grade/${gradeId}/matrix/${matrixId}/evaluate`);
    };

    // Obtener fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];

    const { setHeaderTitle } = useHeaderStore(); // Get setHeaderTitle from Zustand store

    useEffect(() => {
        if (gradeId) {
            loadMatricesByClassroom(gradeId); // Pass gradeId directly as string
            const fetchClassroom = async () => {
                const fetchedClassroom = await getClassroomById(gradeId);
                if (fetchedClassroom) {
                    setHeaderTitle(`Aula ${fetchedClassroom.name} - ${fetchedClassroom.grade}° ${fetchedClassroom.section}`);
                } else {
                    setHeaderTitle('Cargando aula...');
                }
            };
            fetchClassroom();
        }
    }, [gradeId, loadMatricesByClassroom, setHeaderTitle]);

    return (
        <div className="min-h-full">
            {/* The header content is now managed by MainLayout */}
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-primary-100 p-3 rounded-xl">
                        <BookOpen className="h-8 w-8 text-primary-600" />
                    </div>
                    <div>
                        {/* Title is now in MainLayout */}
                        <p className="text-neutral-600">
                            Gestiona estudiantes y matrices de evaluación
                        </p>
                    </div>
                </div>

                {/* Botones principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={goToStudents}
                        className="flex items-center justify-center space-x-3 bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-4 rounded-xl transition-colors duration-200 shadow-sm"
                    >
                        <Users className="h-5 w-5" />
                        <span className="font-medium">Ver Estudiantes</span>
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center space-x-3 bg-accent-600 hover:bg-accent-700 text-white px-6 py-4 rounded-xl transition-colors duration-200 shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="font-medium">Nueva Matriz de Evaluación</span>
                    </button>
                </div>
            </div>

            {/* Lista de matrices de evaluación */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Matrices de Evaluación
                </h2>

                {evaluationMatrices.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-neutral-300">
                        <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="h-8 w-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                            No hay matrices de evaluación
                        </h3>
                        <p className="text-neutral-600 mb-4">
                            Crea tu primera matriz para comenzar a evaluar estudiantes
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {evaluationMatrices.map((matrix) => (
                            <div
                                key={matrix.id}
                                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                onClick={() => goToEvaluation(matrix.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-accent-100 p-3 rounded-lg">
                                        <ClipboardList className="h-6 w-6 text-accent-600" />
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditMatrix(matrix.id); }}
                                            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteMatrix(matrix.id); }}
                                            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                    {matrix.name}
                                </h3>

                                <div className="flex items-center text-sm text-neutral-600 mb-3">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>{new Date(matrix.date).toLocaleDateString()}</span>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para crear matriz de evaluación */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-200 sticky top-0 bg-white">
                            <h2 className="text-xl font-semibold text-neutral-900">
                                {editingMatrixId ? 'Editar Matriz de Evaluación' : 'Nueva Matriz de Evaluación'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario */}
                        <div className="p-6 space-y-6">
                            {/* Nombre de la evaluación */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Nombre de la Evaluación *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.name ? 'border-error-500' : 'border-neutral-300'
                                        }`}
                                    placeholder="Ej: Evaluación de Matemáticas - Unidad 1"
                                />
                                {errors.name && (
                                    <p className="text-error-600 text-sm mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Fecha de Evaluación *
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    min={today}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.date ? 'border-error-500' : 'border-neutral-300'
                                        }`}
                                />
                                {errors.date && (
                                    <p className="text-error-600 text-sm mt-1">{errors.date}</p>
                                )}
                            </div>

                            {/* Criterios de evaluación */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        Criterios de Evaluación *
                                    </label>
                                    <span className="text-xs text-neutral-500">
                                        {criteria.length}/5 criterios
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {criteria.map((criterion, index) => (
                                        <div key={criterion.id} className="flex items-center space-x-2">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={criterion.name}
                                                    onChange={(e) => handleCriteriaChange(criterion.id, e.target.value)}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder={`Criterio ${index + 1}`}
                                                />
                                            </div>

                                            {criteria.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCriteria(criterion.id)}
                                                    className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {criteria.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={addCriteria}
                                        className="mt-3 w-full px-4 py-2 border-2 border-dashed border-neutral-300 text-neutral-600 hover:border-primary-300 hover:text-primary-600 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Agregar criterio</span>
                                    </button>
                                )}

                                {errors.criteria && (
                                    <p className="text-error-600 text-sm mt-2">{errors.criteria}</p>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="flex space-x-3 pt-6 border-t border-neutral-200">
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
                                    {editingMatrixId ? 'Guardar Cambios' : 'Crear Matriz'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradePage;
