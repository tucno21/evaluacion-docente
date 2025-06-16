import { useState, useEffect } from 'react';
import { Users, Plus, Calendar, ClipboardList, X, Trash2, Pencil, CheckCircle, Copy, FileDown } from 'lucide-react'; // Added Copy, FileDown and EyeOff icon
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useHeaderStore } from '../store/useHeaderStore';
import type { EvaluationMatrix, EvaluationCriterion, Classroom } from '../types/types'; // Added Classroom type
import { v4 as uuidv4 } from 'uuid';
import { getClassroomById, getAllClassrooms } from '../utils/indexDB'; // Added getAllClassrooms
import ModalAlert from '../components/ModalAlert'; // Import ModalAlert
import Inputs from '../components/Inputs'; // Import Inputs component
import Select from '../components/Select'; // Import Select component
import Button from '../components/Button'; // Import Button component
import LoadingSpinner from '../components/LoadingSpinner'; // Import LoadingSpinner component
import { generateEvaluationExcel, generateParticipationExcel, generateCriteriaExcel } from '../utils/excel'; // Import the new excel functions

const GradePage = () => {
    const { gradeId } = useParams<{ gradeId: string }>();
    const navigate = useNavigate();
    const {
        evaluationMatrices,
        loadMatricesByClassroom,
        addNewEvaluationMatrix,
        updateExistingMatrix,
        removeMatrix,
        loadStudentsByClassroom,
        loadEvaluationsByMatrix,
        loadParticipationEvaluationsByMatrix,
        getAllEvaluationMatrices, // Added to fetch all matrices for date range export
        getAllStudentEvaluations, // Added to fetch all student evaluations for date range export
        getAllParticipationEvaluations // Added to fetch all participation evaluations for date range export
    } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [matrixToDeleteId, setMatrixToDeleteId] = useState<string | null>(null);
    const [editingMatrixId, setEditingMatrixId] = useState<string | null>(null);
    const [matrixToCopy, setMatrixToCopy] = useState<EvaluationMatrix | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        date: ''
    });
    const [copyFormData, setCopyFormData] = useState({
        classroomId: '',
        date: ''
    });
    const [criteria, setCriteria] = useState<EvaluationCriterion[]>([
        { id: uuidv4(), name: '' }
    ]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [copyErrors, setCopyErrors] = useState<Record<string, string>>({});
    const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
    const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
    const [downloadMessage, setDownloadMessage] = useState(''); // New state for download message
    const [expandedMatrixId, setExpandedMatrixId] = useState<string | null>(null); // New state for expanded matrix

    // New states for Excel export modal
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState<'criterios' | 'participacion' | ''>('');
    const [exportStartDate, setExportStartDate] = useState<string>('');
    const [exportEndDate, setExportEndDate] = useState<string>('');
    const [exportErrors, setExportErrors] = useState<Record<string, string>>({});

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

    // Validations for Excel export modal
    const validateExportForm = () => {
        const newErrors: Record<string, string> = {};
        if (!exportType) {
            newErrors.exportType = 'Debe seleccionar un tipo de exportación';
        }
        if (!exportStartDate) {
            newErrors.exportStartDate = 'La fecha de inicio es obligatoria';
        }
        if (!exportEndDate) {
            newErrors.exportEndDate = 'La fecha de fin es obligatoria';
        }
        if (exportStartDate && exportEndDate && new Date(exportStartDate) > new Date(exportEndDate)) {
            newErrors.exportEndDate = 'La fecha de fin no puede ser anterior a la fecha de inicio';
        }
        setExportErrors(newErrors);
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

    // Handler para copiar la matriz
    const handleCopySubmit = async () => {
        if (!validateCopyForm() || !matrixToCopy) return;

        const newMatrix: Omit<EvaluationMatrix, 'id'> = {
            classroomId: copyFormData.classroomId,
            name: matrixToCopy.name,
            date: copyFormData.date,
            criteria: matrixToCopy.criteria.map(c => ({ id: uuidv4(), name: c.name })), // Generate new IDs for criteria
        };

        await addNewEvaluationMatrix(newMatrix);
        closeCopyModal();
        navigate(`/grade/${copyFormData.classroomId}`); // Navigate to the new classroom's grade page
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

    const closeExportModal = () => {
        setIsExportModalOpen(false);
        setExportType('');
        setExportStartDate('');
        setExportEndDate('');
        setExportErrors({});
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleExportInputChange = (field: string, value: string) => {
        if (field === 'exportType') {
            setExportType(value as 'criterios' | 'participacion' | '');
        } else if (field === 'exportStartDate') {
            setExportStartDate(value);
        } else if (field === 'exportEndDate') {
            setExportEndDate(value);
        }
        if (exportErrors[field]) {
            setExportErrors(prev => ({ ...prev, [field]: '' }));
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

    const handleSingleMatrixDownloadExcel = async (matrix: EvaluationMatrix) => {
        setIsDownloadingExcel(true);
        setDownloadMessage('Generando Excel de Evaluación...');
        try {
            const fetchedStudents = await loadStudentsByClassroom(matrix.classroomId);
            const fetchedStudentEvaluations = await loadEvaluationsByMatrix(matrix.id);
            const fetchedParticipationEvaluations = await loadParticipationEvaluationsByMatrix(matrix.id);

            const excelBlob = generateEvaluationExcel(
                matrix,
                fetchedStudents,
                fetchedStudentEvaluations,
                fetchedParticipationEvaluations
            );

            const url = window.URL.createObjectURL(excelBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${matrix.name}_${new Date(matrix.date).toLocaleDateString('es')}_evaluacion.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error generating or downloading Excel:', error);
            alert('Hubo un error al generar el archivo Excel.');
        } finally {
            setIsDownloadingExcel(false);
            setDownloadMessage('');
        }
    };

    const handleExportExcel = async () => {
        if (!validateExportForm()) return;

        setIsDownloadingExcel(true);
        setDownloadMessage(`Generando Excel de ${exportType === 'criterios' ? 'Criterios' : 'Participación'}...`);
        try {
            const allStudents = await loadStudentsByClassroom(gradeId!); // Get students for current classroom
            const allMatrices = await getAllEvaluationMatrices(); // Get all matrices
            const allStudentEvals = await getAllStudentEvaluations(); // Get all student evaluations
            const allParticipationEvals = await getAllParticipationEvaluations(); // Get all participation evaluations

            let excelBlob: Blob | null = null;
            const start = exportStartDate ? new Date(exportStartDate) : null;
            const end = exportEndDate ? new Date(exportEndDate) : null;

            if (exportType === 'criterios') {
                excelBlob = await generateCriteriaExcel(
                    allMatrices.filter(m => m.classroomId === gradeId), // Filter matrices for current classroom
                    allStudents,
                    allStudentEvals.filter(se => allMatrices.some(m => m.id === se.matrixId && m.classroomId === gradeId)), // Filter student evals for current classroom's matrices
                    allParticipationEvals.filter(pe => allMatrices.some(m => m.id === pe.matrixId && m.classroomId === gradeId)), // Filter participation evals for current classroom's matrices
                    start,
                    end
                );
            } else if (exportType === 'participacion') {
                excelBlob = generateParticipationExcel(
                    allStudents,
                    allParticipationEvals.filter(pe => allMatrices.some(m => m.id === pe.matrixId && m.classroomId === gradeId)), // Filter participation evals for current classroom's matrices
                    allMatrices.filter(m => m.classroomId === gradeId), // Filter matrices for current classroom
                    start,
                    end
                );
            }

            if (excelBlob) {
                const url = window.URL.createObjectURL(excelBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Evaluacion_${exportType}_${new Date().toLocaleDateString('es')}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }

            closeExportModal();
        } catch (error) {
            console.error('Error generating or downloading Excel:', error);
            alert('Hubo un error al generar el archivo Excel.');
        } finally {
            setIsDownloadingExcel(false);
            setDownloadMessage('');
        }
    };

    const goToEvaluation = (matrixId: string) => {
        navigate(`/grade/${gradeId}/matrix/${matrixId}/evaluate`);
    };

    // const today = new Date().toISOString().split('T')[0];
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
            <div className="flex gap-4 justify-center">
                {/* Botón Estudiantes - Secundario */}
                <div className="flex justify-center">
                    <Button
                        onClick={goToStudents}
                        variant="neutral"
                    >
                        <Users className="h-4 w-4" />
                        <span>Ver Estudiantes</span>
                    </Button>
                </div>

                {/* Botón para exportar a Excel (nuevo) */}
                <div className="flex justify-center">
                    <Button
                        onClick={() => setIsExportModalOpen(true)}
                        variant="green"
                        className={`${Object.keys(groupedMatrices).length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Exportar a Excel"
                        disabled={Object.keys(groupedMatrices).length === 0}
                    >
                        <FileDown className="h-4 w-4" />
                        <span>Exportar a Excel</span>
                    </Button>
                </div>
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
                            <div key={monthKey} className="space-y-4">
                                {/* Header del mes mejorado */}
                                <div className="flex items-center space-x-3 px-3">
                                    <div className="h-px bg-gradient-to-r from-transparent to-neutral-200 flex-1"></div>
                                    <div className="bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-sm">
                                        <span className="text-sm font-semibold text-neutral-700">
                                            {group.label}
                                        </span>
                                    </div>
                                    <div className="h-px bg-gradient-to-l from-transparent to-neutral-200 flex-1"></div>
                                </div>

                                {/* Matrices del mes */}
                                <div className="space-y-3 px-1">
                                    {group.matrices.map((matrix) => (
                                        <div
                                            key={matrix.id}
                                            className={`bg-white rounded-2xl border transition-all duration-300 ${expandedMatrixId === matrix.id
                                                ? 'border-accent-200 shadow-lg shadow-accent-100/50'
                                                : 'border-neutral-200 hover:border-accent-200 shadow-sm hover:shadow-md'
                                                }`}
                                        >
                                            {/* Área clickeable principal mejorada */}
                                            <div className="px-2 py-4 cursor-pointer " onClick={() => goToEvaluation(matrix.id)} >
                                                <div className="flex flex-1 justify-between items-center">
                                                    <div className="flex gap-x-3 items-center">
                                                        {/* Icono mejorado */}
                                                        <div className="bg-gradient-to-br from-accent-100 via-accent-200 to-accent-300 p-3 rounded-2xl shrink-0 shadow-sm">
                                                            <ClipboardList className="h-7 w-6 text-accent-700" />
                                                        </div>
                                                        <div className="">
                                                            <h3 className="font-bold text-neutral-900 text-base sm:text-lg leading-tight">
                                                                {matrix.name}
                                                            </h3>
                                                            {/* Metadatos con mejor espaciado */}
                                                            <div className="flex gap-x-3 text-xs text-neutral-600">
                                                                <div className="flex items-center bg-neutral-50 px-2 py-1 rounded-lg">
                                                                    <Calendar className="h-3 w-3 mr-1.5 shrink-0 text-neutral-500" />
                                                                    <span className="font-medium">
                                                                        {new Date(matrix.date).toLocaleDateString('es', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            ...(window.innerWidth > 640 && { weekday: 'short' })
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center bg-neutral-50 px-2 py-1 rounded-lg">
                                                                    <CheckCircle className="h-3 w-3 mr-1.5 shrink-0 text-neutral-500" />
                                                                    <span className="font-medium">{matrix.criteria.length} criterios</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Botón toggle mejorado */}
                                                    <div className=" min-w-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedMatrixId(prevId => (prevId === matrix.id ? null : matrix.id));
                                                            }}
                                                            className={`p-2 rounded-full transition-all duration-200 shrink-0 ${expandedMatrixId === matrix.id
                                                                ? 'bg-accent-100 text-accent-600 rotate-180'
                                                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                                                }`}
                                                            aria-label={expandedMatrixId === matrix.id ? "Contraer acciones" : "Expandir acciones"}
                                                        >
                                                            <svg className="h-5 w-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Barra de acciones completamente rediseñada para móvil */}
                                            <div className={`overflow-hidden transition-all duration-300 ease-out ${expandedMatrixId === matrix.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                                                }`}>
                                                {/* Separador sutil */}
                                                <div className="h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-4"></div>

                                                {/* Grid de botones optimizado para mobile */}
                                                <div className="grid grid-cols-4 gap-0">
                                                    {/* Botón Descargar */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSingleMatrixDownloadExcel(matrix); }}
                                                        className="flex flex-col items-center justify-center py-3 text-neutral-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 active:scale-95 active:bg-green-100 first:rounded-bl-2xl"
                                                        aria-label="Descargar Excel"
                                                        disabled={isDownloadingExcel}
                                                    >
                                                        <div className="bg-green-100 p-1.5 md:p-2 rounded-xl mb-1 group-hover:bg-green-200 transition-colors">
                                                            <FileDown className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                                        </div>
                                                        <span className="text-[0.65rem] md:text-xs font-medium">Excel</span>
                                                    </button>

                                                    {/* Botón Copiar */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCopyMatrix(matrix); }}
                                                        className="flex flex-col items-center justify-center py-3 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 active:scale-95 active:bg-primary-100"
                                                        aria-label="Copiar matriz"
                                                    >
                                                        <div className="bg-primary-100 p-1.5 md:p-2 rounded-xl mb-1 group-hover:bg-primary-200 transition-colors">
                                                            <Copy className="h-4 w-4 md:h-5 md:w-5 text-primary-600" />
                                                        </div>
                                                        <span className="text-[0.65rem] md:text-xs font-medium">Copiar</span>
                                                    </button>

                                                    {/* Botón Editar */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditMatrix(matrix.id); }}
                                                        className="flex flex-col items-center justify-center py-3 text-neutral-600 hover:text-accent-600 hover:bg-accent-50 transition-all duration-200 active:scale-95 active:bg-accent-100"
                                                        aria-label="Editar matriz"
                                                    >
                                                        <div className="bg-accent-100 p-1.5 md:p-2 rounded-xl mb-1 group-hover:bg-accent-200 transition-colors">
                                                            <Pencil className="h-4 w-4 md:h-5 md:w-5 text-accent-600" />
                                                        </div>
                                                        <span className="text-[0.65rem] md:text-xs font-medium">Editar</span>
                                                    </button>

                                                    {/* Botón Eliminar */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteMatrix(matrix.id); }}
                                                        className="flex flex-col items-center justify-center py-3 text-neutral-600 hover:text-error-600 hover:bg-error-50 transition-all duration-200 active:scale-95 active:bg-error-100 last:rounded-br-2xl"
                                                        aria-label="Eliminar matriz"
                                                    >
                                                        <div className="bg-error-100 p-1.5 md:p-2 rounded-xl mb-1 group-hover:bg-error-200 transition-colors">
                                                            <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-error-600" />
                                                        </div>
                                                        <span className="text-[0.65rem] md:text-xs font-medium">Eliminar</span>
                                                    </button>
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
                className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200 active:scale-95"
                aria-label="Crear nueva aula"
            >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Modal para crear/editar matriz */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
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
                        <div className="px-4 py-3 space-y-5">
                            {/* Nombre de la evaluación */}
                            <Inputs
                                label="Nombre de la Evaluación"
                                id="evaluationName"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Ej: Evaluación de Matemáticas - U1"
                                error={errors.name}
                                inputClassName="focus:ring-primary-500"
                            />

                            {/* Fecha */}
                            <Inputs
                                label="Fecha de Evaluación"
                                id="evaluationDate"
                                type="date"
                                value={formData.date}
                                // min={today}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                error={errors.date}
                                inputClassName="focus:ring-primary-500"
                            />

                            {/* Criterios de evaluación */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-semibold text-neutral-700">
                                        Criterios de Evaluación
                                    </label>
                                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                                        {criteria.length}/5
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {criteria.map((criterion, index) => (
                                        <div key={criterion.id} className="flex items-center space-x-2">
                                            <div className="flex-1">
                                                <Inputs
                                                    id={`criterion-${criterion.id}`}
                                                    type="text"
                                                    value={criterion.name}
                                                    onChange={(e) => handleCriteriaChange(criterion.id, e.target.value)}
                                                    placeholder={`Criterio ${index + 1}`}
                                                    inputClassName="focus:ring-primary-500"
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
                                    <Button
                                        type="button"
                                        onClick={addCriteria}
                                        variant="outline"
                                        className="mt-3"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Agregar criterio</span>
                                    </Button>
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
                                    {editingMatrixId ? 'Guardar' : 'Crear'}
                                </Button>
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
                            <Select
                                label="Seleccionar Aula"
                                id="copyClassroom"
                                value={copyFormData.classroomId}
                                onChange={(e) => handleCopyInputChange('classroomId', e.target.value)}
                                error={copyErrors.classroomId}
                                options={[
                                    { value: '', label: '-- Selecciona un aula --' },
                                    ...allClassrooms.map(classroom => ({
                                        value: classroom.id,
                                        label: `${classroom.name} - ${classroom.grade}° ${classroom.section}`
                                    }))
                                ]}
                            />

                            {/* Fecha para la copia */}
                            <Inputs
                                label="Fecha de la Nueva Evaluación"
                                id="copyDate"
                                type="date"
                                value={copyFormData.date}
                                // min={today}
                                onChange={(e) => handleCopyInputChange('date', e.target.value)}
                                error={copyErrors.date}
                            />

                            {/* Botones de acción */}
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={closeCopyModal}
                                    variant="neutral"
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCopySubmit}
                                    className="flex-1"
                                >
                                    Copiar
                                </Button>
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

            {/* Modal para exportar a Excel por rango de fechas */}
            {isExportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">
                                    Exportar Reporte a Excel
                                </h2>
                                <p className="text-sm text-neutral-600 mt-1">
                                    Selecciona el tipo de reporte y el rango de fechas.
                                </p>
                            </div>
                            <button
                                onClick={closeExportModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
                                aria-label="Cerrar modal de exportación"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario de exportación */}
                        <div className="p-6 space-y-5">
                            {/* Tipo de Exportación */}
                            <Select
                                label="Tipo de Reporte"
                                id="exportType"
                                value={exportType}
                                onChange={(e) => handleExportInputChange('exportType', e.target.value)}
                                error={exportErrors.exportType}
                                options={[
                                    { value: '', label: '-- Seleccione una opción --' },
                                    { value: 'criterios', label: 'Por criterios' },
                                    { value: 'participacion', label: 'Por participación' }
                                ]}
                            />

                            {/* Fecha de Inicio */}
                            <Inputs
                                label="Fecha de Inicio"
                                id="exportStartDate"
                                type="date"
                                value={exportStartDate}
                                onChange={(e) => handleExportInputChange('exportStartDate', e.target.value)}
                                error={exportErrors.exportStartDate}
                            />

                            {/* Fecha de Fin */}
                            <Inputs
                                label="Fecha de Fin"
                                id="exportEndDate"
                                type="date"
                                value={exportEndDate}
                                onChange={(e) => handleExportInputChange('exportEndDate', e.target.value)}
                                error={exportErrors.exportEndDate}
                            />

                            {/* Botones de acción */}
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={closeExportModal}
                                    variant="neutral"
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleExportExcel}
                                    variant="green"
                                    className="flex-1"
                                    disabled={isDownloadingExcel}
                                >
                                    Generar Excel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loader global para descargas de Excel */}
            <LoadingSpinner isOpen={isDownloadingExcel} message={downloadMessage} size="lg" color="text-green-500" />
        </div>
    );
};

export default GradePage;
