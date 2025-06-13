import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Save } from 'lucide-react';
import type { StudentEvaluation, AchievementLevel } from '../types/types';
import { useAppStore } from '../store/useAppStore';

const EvaluationPage = () => {
    const { classroomId: classroomIdParam, matrixId: matrixIdParam } = useParams<{ classroomId: string; matrixId: string }>();
    const navigate = useNavigate();

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

    useEffect(() => {
        loadClassrooms();
        // Load matrices first to get the currentMatrix and its classroomId
        if (classroomId) { // Still load matrices by the URL classroomId initially
            loadMatricesByClassroom(classroomId);
        }
        if (matrixId) {
            loadEvaluationsByMatrix(matrixId);
        }
    }, [classroomId, matrixId, loadClassrooms, loadMatricesByClassroom, loadEvaluationsByMatrix]);

    useEffect(() => {
        // Once currentMatrix is loaded, use its classroomId to load students
        if (currentMatrix && currentMatrix.classroomId) {
            loadStudentsByClassroom(currentMatrix.classroomId);
        }
    }, [currentMatrix, loadStudentsByClassroom]);

    useEffect(() => {

        // Initialize evaluationsState once students and existing evaluations are loaded
        if (students.length > 0 && currentMatrix && studentEvaluations) {
            const initialEvaluations: StudentEvaluation[] = students.map(student => {
                const existingEvaluation = studentEvaluations.find(se => se.studentId === student.id);
                if (existingEvaluation) {
                    return existingEvaluation;
                } else {
                    // Create a new evaluation object for students without existing evaluations
                    return {
                        id: '', // Will be set by IndexedDB
                        studentId: student.id,
                        matrixId: matrixId,
                        criteriaEvaluations: currentMatrix.criteria.map(criterion => ({
                            criterionId: criterion.id,
                            level: 'C' // Default level
                        }))
                    };
                }
            });
            setEvaluationsState(initialEvaluations);
        }
    }, [students, currentMatrix, studentEvaluations, matrixId]);

    const handleLevelChange = (studentId: string, criterionId: string, level: AchievementLevel) => {
        setEvaluationsState(prevEvaluations => {
            return prevEvaluations.map(se => {
                if (se.studentId === studentId) {
                    const updatedCriteria = se.criteriaEvaluations.map(ce => {
                        if (ce.criterionId === criterionId) {
                            return { ...ce, level };
                        }
                        return ce;
                    });
                    return { ...se, criteriaEvaluations: updatedCriteria };
                }
                return se;
            });
        });
    };

    const handleSaveEvaluations = async () => {
        if (!currentMatrix) return;

        for (const evaluation of evaluationsState) {
            if (!evaluation.id) { // Check if id is empty string or undefined/null
                // New evaluation
                await addNewStudentEvaluation(evaluation);
            } else {
                // Existing evaluation
                await updateExistingStudentEvaluation(evaluation);
            }
        }
        alert('Evaluaciones guardadas correctamente!');
    };

    const goBack = () => {
        navigate(`/grade/${classroomId}`);
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
        <div className="min-h-full p-6 bg-neutral-100">
            {/* Header */}
            <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={goBack}
                            className="text-neutral-600 hover:text-neutral-900 transition-colors"
                        >
                            ←
                        </button>
                        <div className="bg-primary-100 p-3 rounded-xl">
                            <ClipboardList className="h-8 w-8 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">
                                Evaluación - {currentMatrix.name}
                            </h1>
                            <p className="text-neutral-600">
                                Clase: {currentClassroom.name} {currentClassroom.grade}-{currentClassroom.section}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveEvaluations}
                        className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                        <Save className="h-5 w-5" />
                        <span className="font-medium">Guardar Evaluaciones</span>
                    </button>
                </div>
            </div>

            {/* Evaluation Grid */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                        <tr>
                            <th className="sticky left-0 bg-neutral-50 px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider z-10">
                                N°
                            </th>
                            <th className="sticky left-12 bg-neutral-50 px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider z-10">
                                Nombres y Apellidos de los Estudiantes
                            </th>
                            {currentMatrix.criteria.map(criterion => (
                                <th key={criterion.id} className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider border-l border-neutral-200">
                                    {criterion.name}
                                    <div className="flex justify-center mt-2 space-x-1">
                                        {['C', 'B', 'A', 'AD'].map(level => (
                                            <span key={level} className="text-xs font-semibold px-2 py-1 rounded-full bg-neutral-200 text-neutral-700">
                                                {level}
                                            </span>
                                        ))}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                        {students.map((student, studentIndex) => (
                            <tr key={student.id}>
                                <td className="sticky left-0 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 z-10">
                                    {studentIndex + 1}
                                </td>
                                <td className="sticky left-12 bg-white px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium z-10">
                                    {student.fullName}
                                </td>
                                {currentMatrix.criteria.map(criterion => {
                                    const studentEvaluation = evaluationsState.find(se => se.studentId === student.id);
                                    const criterionEvaluation = studentEvaluation?.criteriaEvaluations.find(ce => ce.criterionId === criterion.id);
                                    const currentLevel = criterionEvaluation?.level || 'C'; // Default to 'C' if not found

                                    return (
                                        <td key={criterion.id} className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 border-l border-neutral-200">
                                            <div className="flex justify-center space-x-2">
                                                {['C', 'B', 'A', 'AD'].map(level => (
                                                    <label key={level} className="inline-flex items-center">
                                                        <input
                                                            type="radio"
                                                            className="form-radio h-4 w-4 text-primary-600"
                                                            name={`student-${student.id}-criterion-${criterion.id}`}
                                                            value={level}
                                                            checked={currentLevel === level}
                                                            onChange={() => handleLevelChange(student.id, criterion.id, level as AchievementLevel)}
                                                        />
                                                        <span className="ml-1 text-neutral-700">{level}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EvaluationPage;
