import { create } from 'zustand';
import type {
    GradeSection,
    Classroom,
    Student,
    EvaluationMatrix,
    StudentEvaluation,
    ParticipationEvaluation,
} from '../types/types';
import {
    addGradeSection,
    getAllGradeSections,
    getGradeSectionByName,
    updateGradeSection,
    deleteGradeSection,
    addClassroom,
    getAllClassrooms,
    updateClassroom,
    deleteClassroom,
    addStudent,
    addMultipleStudents,
    getAllStudents,
    updateStudent,
    deleteStudent,
    addEvaluationMatrix,
    getMatricesByClassroomId,
    updateMatrix,
    deleteMatrix,
    addStudentEvaluation,
    getEvaluationsByMatrixId,
    updateStudentEvaluation,
    getStudentEvaluationByMatrixAndStudent,
    addParticipationEvaluation,
    getParticipationEvaluationsByMatrixId,
    updateParticipationEvaluation,
    getParticipationEvaluationByMatrixAndStudent,
    getAllEvaluationMatrices,
    getAllStudentEvaluations,
    getAllParticipationEvaluations,
    backupDatabase,
    restoreDatabase,
    checkIfDataExists
} from '../utils/indexDB';

interface AppState {
    gradeSections: GradeSection[];
    classrooms: Classroom[];
    students: Student[];
    evaluationMatrices: EvaluationMatrix[];
    studentEvaluations: StudentEvaluation[];
    participationEvaluations: ParticipationEvaluation[];
    loading: boolean;
    error: string | null;

    // GradeSection actions
    loadGradeSections: () => Promise<void>;
    addNewGradeSection: (gradeSection: Omit<GradeSection, 'id'>) => Promise<string | undefined>;
    getGradeSectionByName: (name: string) => Promise<GradeSection | undefined>;
    updateExistingGradeSection: (gradeSection: GradeSection) => Promise<void>;
    deleteGradeSection: (id: string) => Promise<void>;

    // Classroom actions
    loadClassrooms: () => Promise<void>;
    addNewClassroom: (classroom: Omit<Classroom, 'id'>) => Promise<string | undefined>;
    updateExistingClassroom: (classroom: Classroom) => Promise<void>;
    deleteClassroom: (id: string) => Promise<void>;

    // Student actions
    loadAllStudents: () => Promise<void>;
    addStudent: (student: Omit<Student, 'id'>) => Promise<string | undefined>;
    addManyStudents: (students: Omit<Student, 'id'>[]) => Promise<string[] | undefined>;
    updateExistingStudent: (student: Student) => Promise<void>;
    removeStudent: (id: string) => Promise<void>;
    repairStudentsGradeSections: () => Promise<number>; // New function to repair students without gradeSectionId

    // Evaluation Matrix actions
    loadMatricesByClassroom: (classroomId: string) => Promise<void>;
    addNewEvaluationMatrix: (matrix: Omit<EvaluationMatrix, 'id'>) => Promise<string | undefined>;
    updateExistingMatrix: (matrix: EvaluationMatrix) => Promise<void>;
    removeMatrix: (id: string) => Promise<void>;

    // Student Evaluation actions
    loadEvaluationsByMatrix: (matrixId: string) => Promise<StudentEvaluation[]>;
    addNewStudentEvaluation: (evaluation: Omit<StudentEvaluation, 'id'>) => Promise<string | undefined>;
    updateExistingStudentEvaluation: (evaluation: StudentEvaluation) => Promise<void>;
    getStudentEvaluation: (matrixId: string, studentId: string) => Promise<StudentEvaluation | undefined>;

    // Participation Evaluation actions (New)
    loadParticipationEvaluationsByMatrix: (matrixId: string) => Promise<ParticipationEvaluation[]>;
    addNewParticipationEvaluation: (evaluation: Omit<ParticipationEvaluation, 'id'>) => Promise<string | undefined>;
    updateExistingParticipationEvaluation: (evaluation: ParticipationEvaluation) => Promise<void>;
    getParticipationEvaluation: (matrixId: string, studentId: string) => Promise<ParticipationEvaluation | undefined>;

    // Global Get All functions for Excel Export (New)
    getAllEvaluationMatrices: () => Promise<EvaluationMatrix[]>;
    getAllStudentEvaluations: () => Promise<StudentEvaluation[]>; // Corrected type
    getAllParticipationEvaluations: () => Promise<ParticipationEvaluation[]>;

    // Backup and Restore actions
    backupData: () => Promise<void>;
    restoreData: (data: Record<string, any[]>) => Promise<void>;
    checkDataExists: () => Promise<boolean>;
}


export const useAppStore = create<AppState>((set, _get) => ({
    gradeSections: [],
    classrooms: [],
    students: [],
    evaluationMatrices: [],
    studentEvaluations: [],
    participationEvaluations: [],
    loading: false,
    error: null,

    // ===== GradeSection actions =====
    loadGradeSections: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getAllGradeSections();
            set({ gradeSections: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    addNewGradeSection: async (gradeSection) => {
        try {
            const id = await addGradeSection(gradeSection);
            if (id) {
                const newGradeSection = { ...gradeSection, id };
                set((state) => ({
                    gradeSections: [...state.gradeSections, newGradeSection],
                    error: null,
                }));
                return id;
            }
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },
    getGradeSectionByName: async (name) => {
        try {
            const gradeSection = await getGradeSectionByName(name);
            return gradeSection;
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },
    updateExistingGradeSection: async (gradeSection) => {
        try {
            await updateGradeSection(gradeSection);
            set((state) => ({
                gradeSections: state.gradeSections.map((gs) =>
                    gs.id === gradeSection.id ? gradeSection : gs
                ),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    deleteGradeSection: async (id) => {
        try {
            await deleteGradeSection(id);
            set((state) => ({
                gradeSections: state.gradeSections.filter((gs) => gs.id !== id),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    // ===== Classroom actions =====
    // Mantenemos 'loading' para cargas masivas
    loadClassrooms: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getAllClassrooms();
            set({ classrooms: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    // Quitamos 'loading' para operaciones rápidas
    addNewClassroom: async (classroom) => {
        try {
            const id = await addClassroom(classroom);
            if (id) {
                const newClassroom = { ...classroom, id };
                set((state) => ({
                    classrooms: [...state.classrooms, newClassroom],
                    error: null,
                }));
                return id;
            }
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },
    updateExistingClassroom: async (classroom) => {
        try {
            await updateClassroom(classroom);
            set((state) => ({
                classrooms: state.classrooms.map((c) =>
                    c.id === classroom.id ? classroom : c
                ),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    deleteClassroom: async (id) => {
        try {
            await deleteClassroom(id);
            set((state) => ({
                classrooms: state.classrooms.filter((c) => c.id !== id),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    // ===== Student actions =====
    loadAllStudents: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getAllStudents();
            set({ students: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    addStudent: async (student) => {
        try {
            const id = await addStudent(student);
            if (id) {
                const newStudent = { ...student, id };
                set((state) => ({
                    students: [...state.students, newStudent],
                    error: null,
                }));
                return id;
            }
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },
    // Mantenemos 'loading' para cargas múltiples
    addManyStudents: async (students) => {
        set({ loading: true, error: null });
        try {
            const ids = await addMultipleStudents(students);
            if (ids) {
                const newStudents = students.map((s, index) => ({ ...s, id: ids[index] }));
                set((state) => ({
                    students: [...state.students, ...newStudents],
                    loading: false,
                }));
                return ids;
            }
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
        return undefined;
    },
    updateExistingStudent: async (student) => {
        try {
            await updateStudent(student);
            set((state) => ({
                students: state.students.map((s) =>
                    s.id === student.id ? student : s
                ),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    removeStudent: async (id) => {
        try {
            await deleteStudent(id);
            set((state) => ({
                students: state.students.filter((s) => s.id !== id),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    repairStudentsGradeSections: async () => {
        set({ loading: true, error: null });
        try {
            const allStudents = await getAllStudents();
            const allGradeSections = await getAllGradeSections();

            let repairedCount = 0;
            const updatedStudents: Student[] = [];

            for (const student of allStudents) {
                // Si el estudiante no tiene gradeSectionId, intentamos asignar uno
                if (!student.gradeSectionId || student.gradeSectionId === '') {
                    // Intentamos encontrar un GradeSection que coincida parcialmente con el nombre
                    // Por ejemplo, si el estudiante se llamó "Juan Pérez 1A", extraemos "1A"
                    const match = student.fullName.match(/\b(\d+[A-Z])\b/i);
                    if (match) {
                        const gradeSectionName = match[1].toUpperCase();
                        const gradeSection = allGradeSections.find(gs => gs.name === gradeSectionName);

                        if (gradeSection) {
                            await updateStudent({
                                ...student,
                                gradeSectionId: gradeSection.id
                            });

                            updatedStudents.push({
                                ...student,
                                gradeSectionId: gradeSection.id
                            });
                            repairedCount++;
                        }
                    }
                } else {
                    updatedStudents.push(student);
                }
            }

            // Actualizamos el estado local
            set(() => ({
                students: updatedStudents,
                loading: false,
                error: null
            }));

            return repairedCount;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return 0;
        }
    },

    // ===== Evaluation Matrix actions =====
    loadMatricesByClassroom: async (classroomId) => {
        set({ loading: true, error: null });
        try {
            const data = await getMatricesByClassroomId(classroomId);
            set({ evaluationMatrices: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    addNewEvaluationMatrix: async (matrix) => {
        try {
            const id = await addEvaluationMatrix(matrix);
            if (id) {
                const newMatrix = { ...matrix, id };
                set((state) => ({
                    evaluationMatrices: [...state.evaluationMatrices, newMatrix],
                    error: null,
                }));
                return id;
            }
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },
    updateExistingMatrix: async (matrix) => {
        try {
            await updateMatrix(matrix);
            set((state) => ({
                evaluationMatrices: state.evaluationMatrices.map((m) =>
                    m.id === matrix.id ? matrix : m
                ),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    removeMatrix: async (id) => {
        try {
            await deleteMatrix(id);
            set((state) => ({
                evaluationMatrices: state.evaluationMatrices.filter((m) => m.id !== id),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    // ===== Student Evaluation actions =====
    loadEvaluationsByMatrix: async (matrixId) => {
        set({ loading: true, error: null });
        try {
            const data = await getEvaluationsByMatrixId(matrixId);
            set({ studentEvaluations: data, loading: false });
            return data; // Return the fetched data
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return []; // Return empty array on error
        }
    },
    // --- ACCIÓN CLAVE MODIFICADA ---
    addNewStudentEvaluation: async (evaluation) => {
        // set({ loading: true, error: null }); // <-- ELIMINADO
        try {
            const id = await addStudentEvaluation(evaluation);
            if (id) {
                const newEvaluation = { ...evaluation, id };
                set((state) => ({
                    studentEvaluations: [...state.studentEvaluations, newEvaluation],
                    error: null, // Limpiamos errores previos en caso de éxito
                }));
                return id;
            }
        } catch (error: any) {
            set({ error: error.message }); // Solo actualizamos en caso de error
        }
        return undefined;
    },
    // --- ACCIÓN CLAVE MODIFICADA ---
    updateExistingStudentEvaluation: async (evaluation) => {
        // set({ loading: true, error: null }); // <-- ELIMINADO
        try {
            await updateStudentEvaluation(evaluation);
            set((state) => ({
                studentEvaluations: state.studentEvaluations.map((e) =>
                    e.id === evaluation.id ? evaluation : e
                ),
                error: null, // Limpiamos errores previos en caso de éxito
            }));
        } catch (error: any) {
            set({ error: error.message }); // Solo actualizamos en caso de error
        }
    },
    getStudentEvaluation: async (matrixId, studentId) => {
        try {
            const evaluation = await getStudentEvaluationByMatrixAndStudent(matrixId, studentId);
            // No es necesario cambiar el estado global aquí
            return evaluation;
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },

    // ===== Participation Evaluation actions =====
    loadParticipationEvaluationsByMatrix: async (matrixId) => {
        set({ loading: true, error: null, participationEvaluations: [] }); // Clear previous data
        try {
            const data = await getParticipationEvaluationsByMatrixId(matrixId);
            set({ participationEvaluations: data, loading: false });
            return data; // Return the fetched data
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return []; // Return empty array on error
        }
    },
    addNewParticipationEvaluation: async (evaluation) => {
        try {
            const id = await addParticipationEvaluation(evaluation);
            if (id) {
                const newEvaluation = { ...evaluation, id };
                set((state) => ({
                    participationEvaluations: [...state.participationEvaluations, newEvaluation],
                    error: null,
                }));
                return id;
            }
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },
    updateExistingParticipationEvaluation: async (evaluation) => {
        try {
            await updateParticipationEvaluation(evaluation);
            set((state) => ({
                participationEvaluations: state.participationEvaluations.map((e) =>
                    e.id === evaluation.id ? evaluation : e
                ),
                error: null,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    getParticipationEvaluation: async (matrixId, studentId) => {
        try {
            const evaluation = await getParticipationEvaluationByMatrixAndStudent(matrixId, studentId);
            return evaluation;
        } catch (error: any) {
            set({ error: error.message });
        }
        return undefined;
    },

    // ===== Global Get All functions for Excel Export =====
    getAllEvaluationMatrices: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getAllEvaluationMatrices();
            set({ loading: false });
            return data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return [];
        }
    },
    getAllStudentEvaluations: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getAllStudentEvaluations();
            set({ loading: false });
            return data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return [];
        }
    },
    getAllParticipationEvaluations: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getAllParticipationEvaluations();
            set({ loading: false });
            return data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return [];
        }
    },

    // ===== Backup and Restore actions =====
    backupData: async () => {
        set({ loading: true, error: null });
        try {
            const data = await backupDatabase();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `eval-docente-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    restoreData: async (data) => {
        set({ loading: true, error: null });
        try {
            await restoreDatabase(data);
            // Reload all data after restore
            await _get().loadClassrooms();
            // You might want to clear other specific data sets here if necessary
            set({ students: [], evaluationMatrices: [], studentEvaluations: [], participationEvaluations: [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    checkDataExists: async () => {
        set({ loading: true, error: null });
        try {
            const exists = await checkIfDataExists();
            set({ loading: false });
            return exists;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return true; // Assume data exists on error to be safe
        }
    },
}));
