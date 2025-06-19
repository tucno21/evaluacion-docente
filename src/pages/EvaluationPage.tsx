import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import type { StudentEvaluation, AchievementLevel, ParticipationEvaluation, ParticipationLevel } from '../types/types';
import { useAppStore } from '../store/useAppStore';
import { useHeaderStore } from '../store/useHeaderStore';
import BarChartCanvas from '../components/BarChartCanvas'; // Import the new component

const EvaluationPage = () => {
    // --- INICIO: Herramientas de depuración ---
    const renderCount = useRef(1);
    useEffect(() => {
        // Este log se mostrará en cada renderización, permitiéndote contar cuántas veces ocurre.
        console.log(`[DEBUG] Componente renderizado: ${renderCount.current} veces.`);
        renderCount.current += 1;
    });

    useEffect(() => {
        // Este log se mostrará UNA SOLA VEZ cuando el componente se "monta".
        console.log("[DEBUG] El componente EvaluationPage se ha montado.");
    }, []);
    // --- FIN: Herramientas de depuración ---

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
        participationEvaluations,
        loadParticipationEvaluationsByMatrix,
        addNewParticipationEvaluation,
        updateExistingParticipationEvaluation,
        loading,
        error
    } = useAppStore();

    const { setHeaderTitle } = useHeaderStore();

    const currentClassroom = useMemo(() => classrooms.find(c => c.id === classroomId), [classrooms, classroomId]);
    const currentMatrix = useMemo(() => evaluationMatrices.find(m => m.id === matrixId), [evaluationMatrices, matrixId]);

    // EFECTO CONSOLIDADO PARA CARGA DE DATOS
    // Este efecto se encarga de toda la carga de datos inicial.
    useEffect(() => {
        console.log("[DEBUG] Ejecutando efecto de carga de datos...");
        loadClassrooms();

        if (classroomId) {
            loadMatricesByClassroom(classroomId);
        }
        if (matrixId) {
            loadEvaluationsByMatrix(matrixId);
            loadParticipationEvaluationsByMatrix(matrixId);
        }

        // Se ha añadido `currentMatrix?.classroomId` como dependencia directa
        // para la carga de estudiantes, en lugar de un segundo `useEffect`.
        if (currentMatrix?.classroomId) {
            loadStudentsByClassroom(currentMatrix.classroomId);
        }

        // Las funciones de carga del store de Zustand suelen ser estables.
        // Si no lo son, deberían envolverse en `useCallback` en la definición del store.
        // Las quitamos de las dependencias para evitar re-ejecuciones si la referencia de la función cambia.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classroomId, matrixId, currentMatrix?.classroomId]); // Dependencias más estables y precisas


    // EFECTO PARA ACTUALIZAR EL TÍTULO DEL HEADER
    // Separado para mayor claridad y para que se ejecute solo cuando el título cambie.
    useEffect(() => {
        if (currentMatrix) {
            setHeaderTitle(currentMatrix.name);
        } else {
            setHeaderTitle('Cargando evaluación...');
        }
    }, [currentMatrix, setHeaderTitle]);


    // DERIVACIÓN DE ESTADO CON `useMemo` EN LUGAR DE `useState` + `useEffect`
    // Calculamos los datos para la vista directamente desde el store.
    // `useMemo` asegura que este cálculo complejo solo se ejecute cuando los datos relevantes cambian.
    const memoizedEvaluations = useMemo(() => {
        if (!currentMatrix || students.length === 0) return [];

        console.log("[DEBUG] Recalculando `memoizedEvaluations`.");
        return students.map(student => {
            const existingEvaluation = studentEvaluations.find(se => se.studentId === student.id && se.matrixId === matrixId);
            const mergedCriteriaEvaluations = currentMatrix.criteria.map(criterion => {
                const existingCriterionEval = existingEvaluation?.criteriaEvaluations.find(ce => ce.criterionId === criterion.id);
                return existingCriterionEval || {
                    criterionId: criterion.id,
                    level: '' as AchievementLevel
                };
            });

            return {
                id: existingEvaluation?.id || '',
                studentId: student.id,
                matrixId: matrixId,
                criteriaEvaluations: mergedCriteriaEvaluations
            };
        });
    }, [students, currentMatrix, studentEvaluations, matrixId]);

    const memoizedParticipations = useMemo(() => {
        if (students.length === 0) return [];

        console.log("[DEBUG] Recalculando `memoizedParticipations`.");
        return students.map(student => {
            const existingParticipation = participationEvaluations.find(pe => pe.studentId === student.id && pe.matrixId === matrixId);
            return existingParticipation || {
                id: '',
                studentId: student.id,
                matrixId: matrixId,
                level: '' as ParticipationLevel
            };
        });
    }, [students, participationEvaluations, matrixId]);

    // Calculate statistics for the stacked bar chart
    const chartData = useMemo(() => {
        if (!currentMatrix || memoizedEvaluations.length === 0) return [];

        const colors = {
            'C': '#ef4444', // red-500
            'B': '#f59e0b', // yellow-500
            'A': '#0ea5e9', // blue-500
            'AD': '#10b981', // green-500
            '': '#e5e7e9' // white for empty/un-evaluated
        };

        const achievementLevels: AchievementLevel[] = ['C', 'B', 'A', 'AD'];

        return currentMatrix.criteria.map(criterion => {
            const levelCounts: { [key: string]: number } = { 'C': 0, 'B': 0, 'A': 0, 'AD': 0, '': 0 }; // Include empty level

            memoizedEvaluations.forEach(studentEval => {
                const criterionEvaluation = studentEval.criteriaEvaluations.find(ce => ce.criterionId === criterion.id);
                if (criterionEvaluation) {
                    if (achievementLevels.includes(criterionEvaluation.level)) {
                        levelCounts[criterionEvaluation.level]++;
                    } else {
                        levelCounts['']++; // Count empty/un-evaluated
                    }
                } else {
                    levelCounts['']++; // If no evaluation found for criterion, count as empty
                }
            });

            const totalEvaluations = memoizedEvaluations.length;

            const levelsData = Object.entries(levelCounts).map(([level, count]) => ({
                level: level as AchievementLevel,
                count,
                percentage: totalEvaluations > 0 ? (count / totalEvaluations) * 100 : 0,
                color: colors[level as AchievementLevel] || '#ccc'
            }));

            return {
                label: criterion.name,
                levels: levelsData.sort((a, b) => {
                    // Sort levels for consistent stacking order (C, B, A, AD, then empty)
                    const order = ['C', 'B', 'A', 'AD', ''];
                    return order.indexOf(a.level) - order.indexOf(b.level);
                })
            };
        });
    }, [currentMatrix, memoizedEvaluations]);


    // HANDLERS SIMPLIFICADOS
    // Ya no necesitan la lógica de "actualización optimista" porque no hay estado local.
    // Simplemente llaman a la acción del store y confían en que React re-renderizará el componente
    // cuando los datos del store (props) cambien.

    const handleLevelChange = async (studentId: string, criterionId: string, level: AchievementLevel) => {
        const studentEvaluationToUpdate = memoizedEvaluations.find(se => se.studentId === studentId);
        if (!studentEvaluationToUpdate) return;

        const updatedCriteria = studentEvaluationToUpdate.criteriaEvaluations.map(ce =>
            ce.criterionId === criterionId ? { ...ce, level } : ce
        );

        const updatedEvaluation: StudentEvaluation = {
            ...studentEvaluationToUpdate,
            criteriaEvaluations: updatedCriteria
        };

        try {
            if (!updatedEvaluation.id) {
                await addNewStudentEvaluation(updatedEvaluation);
            } else {
                await updateExistingStudentEvaluation(updatedEvaluation);
            }
        } catch (e: any) {
            console.error('Error al guardar la evaluación:', e.message, updatedEvaluation);
        }
    };

    const handleParticipationChange = async (studentId: string, currentLevel: ParticipationLevel | '') => {
        const participationLevels: ParticipationLevel[] = ['C', 'B', 'B+', 'A', 'F'];
        const currentIndex = participationLevels.indexOf(currentLevel as ParticipationLevel);
        const nextIndex = (currentIndex + 1) % participationLevels.length;
        const nextLevel = participationLevels[nextIndex];

        const studentParticipationToUpdate = memoizedParticipations.find(pe => pe.studentId === studentId);

        const updatedParticipation: ParticipationEvaluation = {
            ...(studentParticipationToUpdate || { id: '', studentId, matrixId }),
            level: nextLevel
        };

        try {
            if (!updatedParticipation.id) {
                await addNewParticipationEvaluation(updatedParticipation);
            } else {
                await updateExistingParticipationEvaluation(updatedParticipation);
            }
        } catch (e: any) {
            console.error('Error al guardar la participación:', e.message, updatedParticipation);
        }
    };


    // --- RENDERIZADO DEL COMPONENTE ---

    if (loading && students.length === 0) {
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
            <div className="bg-white border border-neutral-200 shadow-sm p-3 mb-3">
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
                <div className="min-w-full mb-2">
                    {/* Header */}
                    <div className="bg-neutral-50 border-b border-neutral-400 flex">
                        <div className="w-8 border-r border-neutral-400 p-2 text-center font-bold text-xs text-neutral-700 bg-neutral-100 sticky left-0 z-20 flex-shrink-0">
                            N°
                        </div>
                        <div className="w-40 border-r border-black p-2 text-left font-bold text-xs text-neutral-700 bg-neutral-100 sticky left-8 z-20 flex-shrink-0">
                            NOMBRES Y APELLIDOS
                        </div>
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
                        // Obtenemos los datos ya calculados desde las variables "memoized"
                        const studentEvaluation = memoizedEvaluations.find(se => se.studentId === student.id);
                        const studentParticipation = memoizedParticipations.find(pe => pe.studentId === student.id);

                        if (!studentEvaluation) return null; // Importante para evitar errores si los datos aún no están listos

                        const currentParticipationLevel = studentParticipation?.level || '';

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
                                <div className="w-7 md:w-10 border-r border-black bg-white sticky left-8 z-0 flex-shrink-0">
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
                                            <div key={criterion.id} className="flex-1 min-w-20 border-r border-black bg-white">
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

            {/* Gráfico Estadístico */}
            <div className="flex p-4 justify-center items-center bg-white border border-neutral-200 shadow-sm">
                <BarChartCanvas data={chartData} />
            </div>

            {/* Leyenda (sin cambios) */}
            <div className="mt-6 bg-white border border-neutral-200 shadow-sm p-2 md-p-4">
                <div className="text-xs font-bold text-neutral-800 mb-2">Niveles de Logro</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] md:text-xs">
                    <div className="flex items-center space-x-2">
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 font-bold border border-red-700">C</span>
                        <span className="text-neutral-700">En inicio</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 font-bold border border-yellow-700">B</span>
                        <span className="text-neutral-700">En proceso</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 font-bold border border-blue-700">A</span>
                        <span className="text-neutral-700">Logro esperado</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 font-bold border border-green-700">AD</span>
                        <span className="text-neutral-700">Logro destacado</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationPage;
