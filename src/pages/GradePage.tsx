import { useState, useEffect } from 'react';
import { Users, Plus, Calendar, ClipboardList, X, Trash2, Pencil, CheckCircle, Copy } from 'lucide-react'; // Added Copy icon
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useHeaderStore } from '../store/useHeaderStore';
import type { EvaluationMatrix, EvaluationCriterion, Classroom } from '../types/types'; // Added Classroom type
import { v4 as uuidv4 } from 'uuid';
import { getClassroomById, getAllClassrooms } from '../utils/indexDB'; // Added getAllClassrooms
import ModalAlert from '../components/ModalAlert'; // Import ModalAlert

const GradePage = () => {
    const { gradeId } = useParams<{ gradeId: string }>();
    const navigate = useNavigate();
    const { evaluationMatrices, loadMatricesByClassroom, addNewEvaluationMatrix, updateExistingMatrix, removeMatrix } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false); // New state for copy modal
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false); // New state for delete alert modal
    const [matrixToDeleteId, setMatrixToDeleteId] = useState<string | null>(null); // State to hold matrix ID to delete
    const [editingMatrixId, setEditingMatrixId] = useState<string | null>(null);
    const [matrixToCopy, setMatrixToCopy] = useState<EvaluationMatrix | null>(null); // State to hold matrix being copied
    const [formData, setFormData] = useState({
        name: '',
        date: ''
    });
    const [copyFormData, setCopyFormData] = useState({ // New state for copy modal form
        classroomId: '',
        date: ''
    });
    const [criteria, setCriteria] = useState<EvaluationCriterion[]>([
        { id: uuidv4(), name: '' }
    ]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [copyErrors, setCopyErrors] = useState<Record<string, string>>({}); // New state for copy modal errors
    const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]); // State for all classrooms

    // Agrupar matrices por mes y ordenar
    const groupedMatrices = evaluationMatrices
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .reduce((groups, matrix) => {
            const date = new Date(matrix.date);
            const monthYear = date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!groups[monthKey]) {
                groups[monthKey] = {
                    label: monthYear.charAt(0).toUpperCase() + monthYear.slice(1),
                    matrices: []
                };
            }
            groups[monthKey].matrices.push(matrix);
            return groups;
        }, {} as Record<string, { label: string; matrices: EvaluationMatrix[] }>);

    // Validaciones para el modal principal (crear/editar)
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

        const hasEmptyCriteria = criteria.some(c => c.name.trim() === '' && criteria.length > 1);
        if (hasEmptyCriteria) {
            newErrors.criteria = 'Complete todos los criterios o elimine los vacíos';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validaciones para el modal de copiar
    const validateCopyForm = () => {
        const newErrors: Record<string, string> = {};
        if (!copyFormData.classroomId) {
            newErrors.classroomId = 'Debe seleccionar un aula';
        }
        if (!copyFormData.date) {
            newErrors.date = 'La fecha es obligatoria';
        } else {
            const selectedDate = new Date(copyFormData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.date = 'La fecha no puede ser anterior a hoy';
            }
        }
        setCopyErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async () => {
        if (!validateForm()) return;

        const validCriteria: EvaluationCriterion[] = criteria.filter(c => c.name.trim() !== '');

        if (editingMatrixId) {
            const updatedMatrix: EvaluationMatrix = {
                id: editingMatrixId,
                classroomId: gradeId!,
                name: formData.name.trim(),
                date: formData.date,
                criteria: validCriteria.map((c: EvaluationCriterion) => ({ id: c.id!, name: c.name.trim() })),
            };
            await updateExistingMatrix(updatedMatrix);
        } else {
            const newMatrix: Omit<EvaluationMatrix, 'id'> = {
                classroomId: gradeId!,
                name: formData.name.trim(),
                date: formData.date,
                criteria: validCriteria.map((c: EvaluationCriterion) => ({ id: c.id!, name: c.name.trim() })),
            };
            await addNewEvaluationMatrix(newMatrix);
        }
        closeModal();
        loadMatricesByClassroom(gradeId!);
    };

    // Handler para copiar la matriz (la lógica de guardado la harás tú)
    const handleCopySubmit = async () => {
        if (!validateCopyForm() || !matrixToCopy) return;

        // Aquí iría tu lógica para guardar la matriz copiada en el aula y fecha seleccionadas
        // Por ahora, solo cerramos el modal
        console.log('Copiando matriz:', matrixToCopy.name);
        console.log('Al aula:', copyFormData.classroomId);
        console.log('Con fecha:', copyFormData.date);

        closeCopyModal();
        // Después de tu lógica de guardado, probablemente querrías recargar las matrices
        // loadMatricesByClassroom(gradeId!);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMatrixId(null);
        setFormData({ name: '', date: '' });
        setCriteria([{ id: uuidv4(), name: '' }]);
        setErrors({});
    };

    const closeCopyModal = () => {
        setIsCopyModalOpen(false);
        setMatrixToCopy(null);
        setCopyFormData({ classroomId: '', date: '' });
        setCopyErrors({});
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCopyInputChange = (field: string, value: string) => {
        setCopyFormData(prev => ({ ...prev, [field]: value }));
        if (copyErrors[field]) {
            setCopyErrors(prev => ({ ...prev, [field]: '' }));
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
            setCriteria(prev => [...prev, { id: uuidv4(), name: '' }]);
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

    const handleDeleteMatrix = (matrixId: string) => {
        setMatrixToDeleteId(matrixId);
        setIsDeleteAlertOpen(true);
    };

    const confirmDeleteMatrix = async () => {
        if (matrixToDeleteId) {
            await removeMatrix(matrixToDeleteId);
            loadMatricesByClassroom(gradeId!);
            setIsDeleteAlertOpen(false);
            setMatrixToDeleteId(null);
        }
    };

    const closeDeleteAlert = () => {
        setIsDeleteAlertOpen(false);
        setMatrixToDeleteId(null);
    };

    const handleEditMatrix = (matrixId: string) => {
        const matrixToEdit = evaluationMatrices.find(matrix => matrix.id === matrixId);
        if (matrixToEdit) {
            setEditingMatrixId(matrixId);
            setFormData({
                name: matrixToEdit.name,
                date: matrixToEdit.date
            });
            setCriteria(matrixToEdit.criteria.map(c => ({ ...c })));
            setIsModalOpen(true);
        }
    };

    // New handler for copying a matrix
    const handleCopyMatrix = (matrix: EvaluationMatrix) => {
        setMatrixToCopy(matrix);
        setIsCopyModalOpen(true);
    };

    const goToEvaluation = (matrixId: string) => {
        navigate(`/grade/${gradeId}/matrix/${matrixId}/evaluate`);
    };

    const today = new Date().toISOString().split('T')[0];
    const { setHeaderTitle } = useHeaderStore();

    useEffect(() => {
        if (gradeId) {
            loadMatricesByClassroom(gradeId);
            const fetchClassroomAndClassrooms = async () => {
                const fetchedClassroom = await getClassroomById(gradeId);
                if (fetchedClassroom) {
                    setHeaderTitle(`${fetchedClassroom.name} - ${fetchedClassroom.grade}° ${fetchedClassroom.section}`);
                } else {
                    setHeaderTitle('Cargando aula...');
                }
                const classrooms = await getAllClassrooms();
                setAllClassrooms(classrooms.filter(classroom => classroom.id !== gradeId)); // Exclude current classroom
            };
            fetchClassroomAndClassrooms();
        }
    }, [gradeId, loadMatricesByClassroom, setHeaderTitle]);

    return (
        <div className="min-h-full space-y-6">
            {/* Botón Estudiantes - Secundario */}
            <div className="flex justify-center">
                <button
                    onClick={goToStudents}
                    className="flex items-center space-x-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                >
                    <Users className="h-4 w-4" />
                    <span>Ver Estudiantes</span>
                </button>
            </div>

            {/* Lista de matrices agrupadas por mes */}
            {Object.keys(groupedMatrices).length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                    <div className="bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <ClipboardList className="h-8 w-8 sm:h-10 sm:w-10 text-neutral-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                        Sin matrices de evaluación
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-600 mb-6 max-w-sm mx-auto px-4">
                        Crea tu primera matriz para comenzar a evaluar estudiantes
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedMatrices)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([monthKey, group]) => (
                            <div key={monthKey} className="space-y-3">
                                {/* Header del mes */}
                                <div className="flex items-center space-x-2 px-2">
                                    <div className="h-px bg-neutral-200 flex-1"></div>
                                    <span className="text-sm font-medium text-neutral-500 px-3 py-1 bg-neutral-100 rounded-full">
                                        {group.label}
                                    </span>
                                    <div className="h-px bg-neutral-200 flex-1"></div>
                                </div>

                                {/* Matrices del mes */}
                                <div className="space-y-3">
                                    {group.matrices.map((matrix) => (
                                        <div
                                            key={matrix.id}
                                            className="bg-white rounded-xl border border-neutral-200 hover:border-accent-300 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
                                            onClick={() => goToEvaluation(matrix.id)}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center justify-between">
                                                    {/* Contenido principal */}
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        {/* Icono */}
                                                        <div className="bg-gradient-to-br from-accent-100 to-accent-200 p-2.5 rounded-lg">
                                                            <ClipboardList className="h-5 w-5 text-accent-600" />
                                                        </div>

                                                        {/* Información */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-neutral-900 truncate text-base sm:text-lg">
                                                                {matrix.name}
                                                            </h3>
                                                            <div className="flex items-center space-x-4 mt-1">
                                                                <div className="flex items-center text-xs text-neutral-500">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    <span className="hidden sm:inline">
                                                                        {new Date(matrix.date).toLocaleDateString('es', {
                                                                            weekday: 'short',
                                                                            day: 'numeric',
                                                                            month: 'short'
                                                                        })}
                                                                    </span>
                                                                    <span className="sm:hidden">
                                                                        {new Date(matrix.date).toLocaleDateString('es', {
                                                                            day: '2-digit',
                                                                            month: 'short'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center text-xs text-neutral-500">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    <span>{matrix.criteria.length} criterios</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Acciones */}
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCopyMatrix(matrix); }} // New copy button
                                                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                                                            aria-label="Copiar matriz"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditMatrix(matrix.id); }}
                                                            className="p-2 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-all duration-200"
                                                            aria-label="Editar matriz"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMatrix(matrix.id); }}
                                                            className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                                                            aria-label="Eliminar matriz"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Botón flotante para nueva matriz - Muy importante */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent-200 active:scale-95"
                aria-label="Nueva matriz de evaluación"
            >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Modal para crear/editar matriz */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">
                                    {editingMatrixId ? 'Editar Matriz' : 'Nueva Matriz'}
                                </h2>
                                <p className="text-sm text-neutral-600 mt-1">
                                    {editingMatrixId ? 'Modifica los datos de la matriz' : 'Completa la información de evaluación'}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
                                aria-label="Cerrar modal"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario */}
                        <div className="p-6 space-y-5">
                            {/* Nombre de la evaluación */}
                            <div>
                                <label htmlFor="evaluationName" className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Nombre de la Evaluación
                                </label>
                                <input
                                    id="evaluationName"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all ${errors.name ? 'border-error-300 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                    placeholder="Ej: Evaluación de Matemáticas - U1"
                                />
                                {errors.name && (
                                    <p className="text-error-600 text-sm mt-2 flex items-center">
                                        <span className="w-1 h-1 bg-error-600 rounded-full mr-2"></span>
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Fecha */}
                            <div>
                                <label htmlFor="evaluationDate" className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Fecha de Evaluación
                                </label>
                                <input
                                    id="evaluationDate"
                                    type="date"
                                    value={formData.date}
                                    min={today}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all ${errors.date ? 'border-error-300 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                />
                                {errors.date && (
                                    <p className="text-error-600 text-sm mt-2 flex items-center">
                                        <span className="w-1 h-1 bg-error-600 rounded-full mr-2"></span>
                                        {errors.date}
                                    </p>
                                )}
                            </div>

                            {/* Criterios de evaluación */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-neutral-700">
                                        Criterios de Evaluación
                                    </label>
                                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                                        {criteria.length}/5
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
                                                    className="w-full px-4 py-3 border-2 border-neutral-200 hover:border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                                                    placeholder={`Criterio ${index + 1}`}
                                                />
                                            </div>

                                            {criteria.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCriteria(criterion.id)}
                                                    className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                    aria-label="Eliminar criterio"
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
                                        className="mt-3 w-full px-4 py-3 border-2 border-dashed border-neutral-300 text-neutral-600 hover:border-accent-300 hover:text-accent-600 hover:bg-accent-50 rounded-xl transition-all flex items-center justify-center space-x-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Agregar criterio</span>
                                    </button>
                                )}

                                {errors.criteria && (
                                    <p className="text-error-600 text-sm mt-2 flex items-center">
                                        <span className="w-1 h-1 bg-error-600 rounded-full mr-2"></span>
                                        {errors.criteria}
                                    </p>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg"
                                >
                                    {editingMatrixId ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para copiar matriz */}
            {isCopyModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">
                                    Copiar Matriz "{matrixToCopy?.name}"
                                </h2>
                                <p className="text-sm text-neutral-600 mt-1">
                                    Selecciona el aula y la fecha para la nueva matriz.
                                </p>
                            </div>
                            <button
                                onClick={closeCopyModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
                                aria-label="Cerrar modal de copiar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario de copiar */}
                        <div className="p-6 space-y-5">
                            {/* Seleccionar Aula */}
                            <div>
                                <label htmlFor="copyClassroom" className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Seleccionar Aula
                                </label>
                                <select
                                    id="copyClassroom"
                                    value={copyFormData.classroomId}
                                    onChange={(e) => handleCopyInputChange('classroomId', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${copyErrors.classroomId ? 'border-error-300 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                >
                                    <option value="">-- Selecciona un aula --</option>
                                    {allClassrooms.map((classroom) => (
                                        <option key={classroom.id} value={classroom.id}>
                                            {classroom.name} - {classroom.grade}° {classroom.section}
                                        </option>
                                    ))}
                                </select>
                                {copyErrors.classroomId && (
                                    <p className="text-error-600 text-sm mt-2 flex items-center">
                                        <span className="w-1 h-1 bg-error-600 rounded-full mr-2"></span>
                                        {copyErrors.classroomId}
                                    </p>
                                )}
                            </div>

                            {/* Fecha para la copia */}
                            <div>
                                <label htmlFor="copyDate" className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Fecha de la Nueva Evaluación
                                </label>
                                <input
                                    id="copyDate"
                                    type="date"
                                    value={copyFormData.date}
                                    min={today}
                                    onChange={(e) => handleCopyInputChange('date', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${copyErrors.date ? 'border-error-300 bg-error-50' : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                />
                                {copyErrors.date && (
                                    <p className="text-error-600 text-sm mt-2 flex items-center">
                                        <span className="w-1 h-1 bg-error-600 rounded-full mr-2"></span>
                                        {copyErrors.date}
                                    </p>
                                )}
                            </div>

                            {/* Botones de acción */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeCopyModal}
                                    className="flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopySubmit}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg"
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Alerta para Eliminar */}
            <ModalAlert
                isOpen={isDeleteAlertOpen}
                onClose={closeDeleteAlert}
                onConfirm={confirmDeleteMatrix}
                title="Eliminar Matriz de Evaluación"
                message="¿Estás seguro de que quieres eliminar esta matriz de evaluación? Esta acción no se puede deshacer."
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default GradePage;
