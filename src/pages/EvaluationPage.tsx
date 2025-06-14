import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import type { StudentEvaluation, AchievementLevel, CriterionEvaluation } from '../types/types';
import { useAppStore } from '../store/useAppStore';
import { useHeaderStore } from '../store/useHeaderStore'; // Import useHeaderStore

const EvaluationPage = () => {
    const { classroomId: classroomIdParam, matrixId: matrixIdParam } = useParams<{ classroomId: string; matrixId: string }>();

    const classroomId = classroomIdParam || '';
    const matrixId = matrixIdParam || '';

    const {
        classrooms,
        loadClassrooms,
        students,
        loadStudentsByClassroom,
        evaluationMatrices,
        loadMatricesByClassroom,
        studentEvaluations,
        loadEvaluationsByMatrix,
        addNewStudentEvaluation,
        updateExistingStudentEvaluation,
        loading,
        error
    } = useAppStore();

    const currentClassroom = classrooms.find(c => c.id === classroomId);
    const currentMatrix = evaluationMatrices.find(m => m.id === matrixId);

    const [evaluationsState, setEvaluationsState] = useState<StudentEvaluation[]>([]);
    const { setHeaderTitle } = useHeaderStore(); // Get setHeaderTitle from Zustand store

    useEffect(() => {
        loadClassrooms();
        if (classroomId) {
            loadMatricesByClassroom(classroomId);
        }
        if (matrixId) {
            loadEvaluationsByMatrix(matrixId);
        }
    }, [classroomId, matrixId, loadClassrooms, loadMatricesByClassroom, loadEvaluationsByMatrix]);

    useEffect(() => {
        if (currentMatrix && currentMatrix.classroomId) {
            loadStudentsByClassroom(currentMatrix.classroomId);
        }
    }, [currentMatrix, loadStudentsByClassroom]);

    useEffect(() => {
        if (students.length > 0 && currentMatrix && studentEvaluations) {
            const initialEvaluations: StudentEvaluation[] = students.map(student => {
                const existingEvaluation = studentEvaluations.find(se => se.studentId === student.id);
                if (existingEvaluation) {
                    return existingEvaluation;
                } else {
                    return {
                        id: '',
                        studentId: student.id,
                        matrixId: matrixId,
                        criteriaEvaluations: currentMatrix.criteria.map(criterion => ({
                            criterionId: criterion.id,
                            level: '' as AchievementLevel
                        }))
                    };
                }
            });
            setEvaluationsState(initialEvaluations);
        }
        if (currentMatrix) {
            setHeaderTitle(currentMatrix.name);
        } else {
            setHeaderTitle('Cargando evaluación...');
        }
    }, [students, currentMatrix, studentEvaluations, matrixId, setHeaderTitle]);

    const handleLevelChange = async (studentId: string, criterionId: string, level: AchievementLevel) => {
        const studentEvaluationToUpdate = evaluationsState.find((se: StudentEvaluation) => se.studentId === studentId);

        if (!studentEvaluationToUpdate) {
            console.error('Student evaluation not found for studentId:', studentId);
            return;
        }

        const updatedCriteria = studentEvaluationToUpdate.criteriaEvaluations.map((ce: CriterionEvaluation) => {
            if (ce.criterionId === criterionId) {
                return { ...ce, level };
            }
            return ce;
        });

        const updatedEvaluation: StudentEvaluation = {
            ...studentEvaluationToUpdate,
            criteriaEvaluations: updatedCriteria
        };

        setEvaluationsState(prevEvaluations =>
            prevEvaluations.map((se: StudentEvaluation) => (se.studentId === studentId ? updatedEvaluation : se))
        );

        if (!updatedEvaluation.id) {
            const newId = await addNewStudentEvaluation(updatedEvaluation) || '';
            setEvaluationsState(prevEvaluations =>
                prevEvaluations.map((se: StudentEvaluation) => (se.studentId === studentId ? { ...updatedEvaluation, id: newId } : se))
            );
        } else {
            try {
                await updateExistingStudentEvaluation(updatedEvaluation);
            } catch (e: any) {
                console.error('Error updating existing evaluation:', e.message, updatedEvaluation);
            }
        }
    };

    if (loading) {
        return <div className="text-center py-12">Cargando...</div>;
    }

    if (error) {
        return <div className="text-center py-12 text-red-500">Error: {error}</div>;
    }

    if (!currentClassroom || !currentMatrix) {
        return <div className="text-center py-12 text-neutral-600">Clase o Matriz de Evaluación no encontrada.</div>;
    }

    return (
        <div className="min-h-full p-1 sm:p-4 bg-neutral-50">
            {/* Header compacto - now handled by MainLayout */}
            <div className="mb-2 bg-white p-2 rounded shadow-sm">
                <div className="flex items-center space-x-2">
                    {/* Back button is now handled by MainLayout */}
                    <ClipboardList className="h-4 w-4 text-primary-600" />
                    <div className="flex-1 min-w-0">
                        {/* Title is now in MainLayout */}
                        <p className="text-xs text-neutral-600">
                            {currentClassroom.name} {currentClassroom.grade}-{currentClassroom.section}
                        </p>
                    </div>
                </div>
            </div>

            {/* Contenedor con scroll horizontal */}
            <div className="bg-white border border-neutral-300 rounded shadow-sm overflow-x-auto">
                <div className="min-w-full">
                    {/* Header */}
                    <div className="bg-neutral-100 border-b border-neutral-300 flex">
                        {/* Columna N° fija */}
                        <div className="w-8 border-r border-neutral-300 p-1 text-center font-bold text-xs bg-neutral-100 sticky left-0 z-20 flex-shrink-0">
                            N°
                        </div>
                        {/* Columna Nombres fija */}
                        <div className="w-40 border-r border-neutral-300 p-1 text-left font-bold text-xs bg-neutral-100 sticky left-8 z-20 flex-shrink-0">
                            NOMBRES Y APELLIDOS
                        </div>
                        {/* Columnas de criterios - ocupan el espacio restante */}
                        <div className="flex flex-1 min-w-0">
                            {currentMatrix.criteria.map(criterion => (
                                <div key={criterion.id} className="flex-1 min-w-20 border-r-2 border-black pt-1 text-center bg-yellow-100 flex flex-col justify-between">
                                    <div className="text-xs leading-tight mb-1 font-bold break-words px-1 pb-1">{criterion.name}</div>
                                    <div className="flex justify-center w-full">
                                        <span className="bg-red-200 text-red-800 px-0.5 py-0.5 text-xs font-bold w-full">C</span>
                                        <span className="bg-yellow-200 text-yellow-800 px-0.5 py-0.5 text-xs font-bold w-full">B</span>
                                        <span className="bg-blue-200 text-blue-800 px-0.5 py-0.5 text-xs font-bold w-full">A</span>
                                        <span className="bg-green-200 text-green-800 px-0.5 py-0.5 text-xs font-bold w-full">AD</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filas de estudiantes */}
                    {students.map((student, studentIndex) => {
                        const studentEvaluation = evaluationsState.find(se => se.studentId === student.id);
                        if (!studentEvaluation) return null;

                        return (
                            <div key={student.id} className="flex hover:bg-neutral-50 border-b border-neutral-200">
                                {/* Número fijo */}
                                <div className="w-8 border-r border-neutral-300 p-1 text-center font-medium text-xs bg-white sticky left-0 z-10 flex-shrink-0">
                                    {studentIndex + 1}
                                </div>
                                {/* Nombre fijo */}
                                <div className="w-40 border-r border-neutral-300 p-1 text-left font-medium text-xs bg-white sticky left-8 z-10 flex-shrink-0">
                                    <div className="truncate leading-tight">{student.fullName}</div>
                                </div>
                                {/* Celdas de evaluación - ocupan el espacio restante */}
                                <div className="flex flex-1 min-w-0">
                                    {currentMatrix.criteria.map(criterion => {
                                        const criterionEvaluation = studentEvaluation?.criteriaEvaluations.find(ce => ce.criterionId === criterion.id);
                                        const currentLevel = criterionEvaluation?.level || '';

                                        return (
                                            <div key={criterion.id} className="flex-1 min-w-20 border-r-2 border-black bg-white">
                                                <div className="grid grid-cols-4 h-8">
                                                    {['C', 'B', 'A', 'AD'].map((level, levelIndex) => {
                                                        const isSelected = currentLevel === level;
                                                        const bgColor = levelIndex === 0 ? 'hover:bg-red-50' :
                                                            levelIndex === 1 ? 'hover:bg-yellow-50' :
                                                                levelIndex === 2 ? 'hover:bg-blue-50' : 'hover:bg-green-50';

                                                        return (
                                                            <button
                                                                key={level}
                                                                className={`
                                                                    h-8 border-r border-neutral-200 last:border-r-0
                                                                    flex items-center justify-center text-xs font-bold
                                                                    touch-manipulation active:scale-95 transition-all
                                                                    ${bgColor}
                                                                    ${isSelected ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-800'}
                                                                `}
                                                                onClick={() => handleLevelChange(student.id, criterion.id, level as AchievementLevel)}
                                                                type="button"
                                                            >
                                                                {isSelected ? '✓' : level}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Leyenda */}
            <div className="mt-2 bg-white p-2 rounded shadow-sm">
                <div className="text-xs font-bold text-neutral-700 mb-1">CRITERIOS DE EVALUACIÓN</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
                    <div className="flex items-center space-x-1">
                        <span className="bg-red-200 text-red-800 px-1 py-0.5  font-bold">C</span>
                        <span>En inicio</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="bg-yellow-200 text-yellow-800 px-1 py-0.5 font-bold">B</span>
                        <span>En proceso</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="bg-blue-200 text-blue-800 px-1 py-0.5 font-bold">A</span>
                        <span>Logro esperado</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="bg-green-200 text-green-800 px-1 py-0.5 font-bold">AD</span>
                        <span>Logro destacado</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationPage;
