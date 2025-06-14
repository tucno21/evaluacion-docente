import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import type { StudentEvaluation, AchievementLevel, CriterionEvaluation, ParticipationEvaluation, ParticipationLevel } from '../types/types';
import { useAppStore } from '../store/useAppStore';
import { useHeaderStore } from '../store/useHeaderStore';


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
        participationEvaluations, // New
        loadParticipationEvaluationsByMatrix, // New
        addNewParticipationEvaluation, // New
        updateExistingParticipationEvaluation, // New
        loading,
        error
    } = useAppStore();

    const currentClassroom = classrooms.find(c => c.id === classroomId);
    const currentMatrix = evaluationMatrices.find(m => m.id === matrixId);

    const [evaluationsState, setEvaluationsState] = useState<StudentEvaluation[]>([]);
    const [participationEvaluationsState, setParticipationEvaluationsState] = useState<ParticipationEvaluation[]>([]); // New state
    const { setHeaderTitle } = useHeaderStore();

    useEffect(() => {
        loadClassrooms();
        if (classroomId) {
            loadMatricesByClassroom(classroomId);
        }
        if (matrixId) {
            loadEvaluationsByMatrix(matrixId);
            loadParticipationEvaluationsByMatrix(matrixId); // New: Load participation data
        }
    }, [classroomId, matrixId, loadClassrooms, loadMatricesByClassroom, loadEvaluationsByMatrix, loadParticipationEvaluationsByMatrix]); // Added loadParticipationEvaluationsByMatrix

    useEffect(() => {
        if (currentMatrix && currentMatrix.classroomId) {
            loadStudentsByClassroom(currentMatrix.classroomId);
        }
    }, [currentMatrix, loadStudentsByClassroom]);

    useEffect(() => {
        if (evaluationsState.length > 0 && participationEvaluationsState.length > 0 && students.length > 0) {
            return;
        }

        if (students.length > 0 && currentMatrix) {
            // Initialize StudentEvaluations
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

            // Initialize ParticipationEvaluations
            const initialParticipationEvaluations: ParticipationEvaluation[] = students.map(student => {
                const existingParticipation = participationEvaluations.find(pe => pe.studentId === student.id);
                if (existingParticipation) {
                    return existingParticipation;
                } else {
                    return {
                        id: '',
                        studentId: student.id,
                        matrixId: matrixId,
                        level: '' as ParticipationLevel // Default empty level
                    };
                }
            });
            setParticipationEvaluationsState(initialParticipationEvaluations);
        }

        if (currentMatrix) {
            setHeaderTitle(currentMatrix.name);
        } else {
            setHeaderTitle('Cargando evaluación...');
        }
    }, [students, currentMatrix, studentEvaluations, participationEvaluations, matrixId, setHeaderTitle, evaluationsState.length, participationEvaluationsState.length]); // Added participationEvaluations and participationEvaluationsState.length

    const handleLevelChange = async (studentId: string, criterionId: string, level: AchievementLevel) => {
        const studentEvaluationToUpdate = evaluationsState.find((se: StudentEvaluation) => se.studentId === studentId);

        if (!studentEvaluationToUpdate) {
            return;
        }

        const updatedCriteria = studentEvaluationToUpdate.criteriaEvaluations.map((ce: CriterionEvaluation) =>
            ce.criterionId === criterionId ? { ...ce, level } : ce
        );

        const updatedEvaluation: StudentEvaluation = {
            ...studentEvaluationToUpdate,
            criteriaEvaluations: updatedCriteria
        };

        // 1. Actualización optimista: renderiza el cambio en la UI inmediatamente.
        setEvaluationsState(prevEvaluations =>
            prevEvaluations.map((se: StudentEvaluation) => (se.studentId === studentId ? updatedEvaluation : se))
        );

        // 2. Sincronización con el backend/store global en segundo plano.
        if (!updatedEvaluation.id) {
            const newId = await addNewStudentEvaluation(updatedEvaluation);
            if (newId) {
                // Actualiza el ID en el estado local para que la siguiente vez se use 'update' en lugar de 'add'
                setEvaluationsState(prevEvaluations =>
                    prevEvaluations.map((se) =>
                        se.studentId === studentId ? { ...updatedEvaluation, id: newId } : se
                    )
                );
            }
        } else {
            try {
                await updateExistingStudentEvaluation(updatedEvaluation);
            } catch (e: any) {
                console.error('Error updating existing evaluation:', e.message, updatedEvaluation);
                // Opcional: Revertir el estado si la actualización falla
            }
        }
    };

    const handleParticipationChange = async (studentId: string, currentLevel: ParticipationLevel | '') => {
        const participationLevels: ParticipationLevel[] = ['C', 'B', 'B+', 'A', 'F'];
        const currentIndex = participationLevels.indexOf(currentLevel as ParticipationLevel);
        const nextIndex = (currentIndex + 1) % participationLevels.length;
        const nextLevel = participationLevels[nextIndex];

        const studentParticipationToUpdate = participationEvaluationsState.find((pe: ParticipationEvaluation) => pe.studentId === studentId);

        const updatedParticipation: ParticipationEvaluation = {
            ...(studentParticipationToUpdate || { id: '', studentId, matrixId }),
            level: nextLevel
        };

        // 1. Actualización optimista
        setParticipationEvaluationsState(prevParticipations =>
            prevParticipations.map((pe: ParticipationEvaluation) => (pe.studentId === studentId ? updatedParticipation : pe))
        );

        // 2. Sincronización con el backend/store global
        if (!updatedParticipation.id) {
            const newId = await addNewParticipationEvaluation(updatedParticipation);
            if (newId) {
                setParticipationEvaluationsState(prevParticipations =>
                    prevParticipations.map((pe) =>
                        pe.studentId === studentId ? { ...updatedParticipation, id: newId } : pe
                    )
                );
            }
        } else {
            try {
                await updateExistingParticipationEvaluation(updatedParticipation);
            } catch (e: any) {
                console.error('Error updating participation evaluation:', e.message, updatedParticipation);
                // Opcional: Revertir el estado si la actualización falla
            }
        }
    };

    if (loading) {
        return <div className="text-center py-12">Cargando...</div>;
    }

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
        <div className="min-h-full space-y-4 p-2 sm:p-6 bg-neutral-50">
            {/* Información del Aula */}
            <div className="bg-white  border border-neutral-200 shadow-sm p-3 mb-3">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-2.5 rounded-lg">
                        <ClipboardList className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-neutral-900 truncate text-base sm:text-lg">
                            {currentMatrix?.name || 'Evaluación'}
                        </h2>
                        <p className="text-xs text-neutral-600 mt-0.5">
                            {currentClassroom.name} {currentClassroom.grade}-{currentClassroom.section}
                        </p>
                    </div>
                </div>
            </div>

            {/* Contenedor con scroll horizontal */}
            <div className="bg-white border border-neutral-400 cursor-pointer shadow-sm hover:shadow-md overflow-x-auto">
                <div className="min-w-full">
                    {/* Header */}
                    <div className="bg-neutral-50 border-b border-neutral-400 flex">
                        <div className="w-8 border-r border-neutral-400 p-2 text-center font-bold text-xs text-neutral-700 bg-neutral-100 sticky left-0 z-20 flex-shrink-0">
                            N°
                        </div>
                        <div className="w-40 border-r border-black p-2 text-left font-bold text-xs text-neutral-700 bg-neutral-100 sticky left-8 z-20 flex-shrink-0">
                            NOMBRES Y APELLIDOS
                        </div>
                        {/* New PARTICIPO Header */}
                        <div className="w-7 md:w-10 border-r border-black p-2 text-left font-bold text-xs text-neutral-700 bg-neutral-100 sticky left-8 z-0 flex-shrink-0">
                            PT
                        </div>
                        <div className="flex flex-1 min-w-0">
                            {currentMatrix.criteria.map(criterion => (
                                <div key={criterion.id} className="flex-1 min-w-20 border-r border-black pt-2 text-center bg-neutral-100 flex flex-col justify-between">
                                    <div className="text-xs leading-tight mb-1 font-bold break-words px-1 pb-1 text-neutral-700">{criterion.name}</div>
                                    <div className="flex justify-center w-full border-t border-neutral-400">
                                        <span className="bg-neutral-200 text-neutral-700 px-0.5 py-0.5 text-xs font-bold w-full border-r border-neutral-400">C</span>
                                        <span className="bg-neutral-200 text-neutral-700 px-0.5 py-0.5 text-xs font-bold w-full border-r border-neutral-400">B</span>
                                        <span className="bg-neutral-200 text-neutral-700 px-0.5 py-0.5 text-xs font-bold w-full border-r border-neutral-400">A</span>
                                        <span className="bg-neutral-200 text-neutral-700 px-0.5 py-0.5 text-xs font-bold w-full">AD</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filas de estudiantes */}
                    {students.map((student, studentIndex) => {
                        const studentEvaluation = evaluationsState.find(se => se.studentId === student.id);
                        const studentParticipation = participationEvaluationsState.find(pe => pe.studentId === student.id);
                        const currentParticipationLevel = studentParticipation?.level || '';

                        if (!studentEvaluation) return null;

                        return (
                            <div key={student.id} className="flex hover:bg-neutral-50 border-b border-neutral-400">
                                {/* Número fijo */}
                                <div className="w-8 border-r border-neutral-400 p-2 text-center font-medium text-xs bg-white sticky left-0 z-10 flex-shrink-0">
                                    {studentIndex + 1}
                                </div>
                                {/* Nombre fijo */}
                                <div className="w-40 border-r border-black p-2 text-left font-medium text-xs bg-white sticky left-8 z-10 flex-shrink-0">
                                    <div className="truncate leading-tight text-neutral-800">{student.fullName}</div>
                                </div>
                                {/* PARTICIPO Cell */}
                                <div className="w-7 md:w-10 border-r border-black bg-white left-48 z-0 flex-shrink-0">
                                    <button
                                        className={`
                                            h-full w-full flex items-center justify-center text-xs font-bold
                                            touch-manipulation active:scale-95 transition-all duration-150
                                            ${currentParticipationLevel ? 'bg-primary-600 text-white' : 'text-neutral-300 hover:bg-neutral-100'}
                                        `}
                                        onClick={() => handleParticipationChange(student.id, currentParticipationLevel)}
                                        type="button"
                                    >
                                        {currentParticipationLevel || 'F'}
                                    </button>
                                </div>
                                {/* Celdas de evaluación */}
                                <div className="flex flex-1 min-w-0">
                                    {currentMatrix.criteria.map(criterion => {
                                        const criterionEvaluation = studentEvaluation?.criteriaEvaluations.find(ce => ce.criterionId === criterion.id);
                                        const currentLevel = criterionEvaluation?.level || '';

                                        return (
                                            <div key={criterion.id} className="flex-1 min-w-20 border-r-1 border-black bg-white">
                                                <div className="grid grid-cols-4 h-8">
                                                    {['C', 'B', 'A', 'AD'].map((level) => {
                                                        const isSelected = currentLevel === level;

                                                        return (
                                                            <button
                                                                key={level}
                                                                className={`
                                                                    h-full border-r border-neutral-400 last:border-r-0
                                                                    flex items-center justify-center text-xs font-bold
                                                                    touch-manipulation active:scale-95 transition-all duration-150
                                                                    ${isSelected ? 'bg-primary-600 text-white' : 'text-neutral-300 hover:bg-neutral-100'}
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
            <div className="mt-6 bg-white border border-neutral-200 shadow-sm p-2 md-p-4">
                <div className="text-sm font-bold text-neutral-800 mb-2">Niveles de Logro</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                        <span className="bg-red-100 text-red-700 px-2 py-1 font-bold border border-red-700">C</span>
                        <span className="text-neutral-700">En inicio</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 font-bold border border-yellow-700">B</span>
                        <span className="text-neutral-700">En proceso</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 font-bold border border-blue-700">A</span>
                        <span className="text-neutral-700">Logro esperado</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 font-bold border border-green-700">AD</span>
                        <span className="text-neutral-700">Logro destacado</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationPage;
