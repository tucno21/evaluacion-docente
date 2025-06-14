import { create } from 'zustand';
import type {
    Classroom,
    Student,
    EvaluationMatrix,
    StudentEvaluation,
    ParticipationEvaluation, // New import
} from '../types/types';
import {
    addClassroom,
    getAllClassrooms,
    updateClassroom,
    deleteClassroom,
    addStudent,
    addMultipleStudents,
    getStudentsByClassroomId,
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
    // New imports for participation
    addParticipationEvaluation,
    getParticipationEvaluationsByMatrixId,
    updateParticipationEvaluation,
    getParticipationEvaluationByMatrixAndStudent
} from '../utils/indexDB';

interface AppState {
    classrooms: Classroom[];
    students: Student[];
    evaluationMatrices: EvaluationMatrix[];
    studentEvaluations: StudentEvaluation[];
    participationEvaluations: ParticipationEvaluation[]; // New state
    loading: boolean;
    error: string | null;

    // Classroom actions
    loadClassrooms: () => Promise<void>;
    addNewClassroom: (classroom: Omit<Classroom, 'id'>) => Promise<string | undefined>;
    updateExistingClassroom: (classroom: Classroom) => Promise<void>;
    deleteClassroom: (id: string) => Promise<void>;

    // Student actions
    loadStudentsByClassroom: (classroomId: string) => Promise<Student[]>;
    addStudent: (student: Omit<Student, 'id'>) => Promise<string | undefined>;
    addManyStudents: (students: Omit<Student, 'id'>[]) => Promise<string[] | undefined>;
    updateExistingStudent: (student: Student) => Promise<void>;
    removeStudent: (id: string) => Promise<void>;

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
}


export const useAppStore = create<AppState>((set, _get) => ({
    classrooms: [],
    students: [],
    evaluationMatrices: [],
    studentEvaluations: [],
    participationEvaluations: [], // Initialize new state
    loading: false,
    error: null,

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
    loadStudentsByClassroom: async (classroomId) => {
        set({ loading: true, error: null });
        try {
            const data = await getStudentsByClassroomId(classroomId);
            set({ students: data, loading: false });
            return data; // Return the fetched data
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return []; // Return empty array on error
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
}));
