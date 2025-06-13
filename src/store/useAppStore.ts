import { create } from 'zustand';
import type {
    Classroom,
    Student,
    EvaluationMatrix,
    StudentEvaluation
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
    getStudentEvaluationByMatrixAndStudent
} from '../utils/indexDB';

interface AppState {
    classrooms: Classroom[];
    students: Student[];
    evaluationMatrices: EvaluationMatrix[];
    studentEvaluations: StudentEvaluation[];
    loading: boolean;
    error: string | null;

    // Classroom actions
    loadClassrooms: () => Promise<void>;
    addNewClassroom: (classroom: Omit<Classroom, 'id'>) => Promise<string | undefined>;
    updateExistingClassroom: (classroom: Classroom) => Promise<void>;
    deleteClassroom: (id: string) => Promise<void>;

    // Student actions
    loadStudentsByClassroom: (classroomId: string) => Promise<void>;
    addNewStudent: (student: Omit<Student, 'id'>) => Promise<string | undefined>;
    addManyStudents: (students: Omit<Student, 'id'>[]) => Promise<string[] | undefined>;
    updateExistingStudent: (student: Student) => Promise<void>;
    removeStudent: (id: string) => Promise<void>;

    // Evaluation Matrix actions
    loadMatricesByClassroom: (classroomId: string) => Promise<void>;
    addNewEvaluationMatrix: (matrix: Omit<EvaluationMatrix, 'id'>) => Promise<string | undefined>;
    updateExistingMatrix: (matrix: EvaluationMatrix) => Promise<void>;
    removeMatrix: (id: string) => Promise<void>;

    // Student Evaluation actions
    loadEvaluationsByMatrix: (matrixId: string) => Promise<void>;
    addNewStudentEvaluation: (evaluation: Omit<StudentEvaluation, 'id'>) => Promise<string | undefined>;
    updateExistingStudentEvaluation: (evaluation: StudentEvaluation) => Promise<void>;
    getStudentEvaluation: (matrixId: string, studentId: string) => Promise<StudentEvaluation | undefined>;
}

export const useAppStore = create<AppState>((set, _get) => ({
    classrooms: [],
    students: [],
    evaluationMatrices: [],
    studentEvaluations: [],
    loading: false,
    error: null,

    // Classroom actions
    loadClassrooms: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getAllClassrooms();
            set({ classrooms: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    addNewClassroom: async (classroom) => {
        set({ loading: true, error: null });
        try {
            const id = await addClassroom(classroom);
            if (id) {
                const newClassroom = { ...classroom, id };
                set((state) => ({
                    classrooms: [...state.classrooms, newClassroom],
                    loading: false,
                }));
                return id;
            }
            set({ loading: false });
            return undefined;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return undefined;
        }
    },
    updateExistingClassroom: async (classroom) => {
        set({ loading: true, error: null });
        try {
            await updateClassroom(classroom);
            set((state) => ({
                classrooms: state.classrooms.map((c) =>
                    c.id === classroom.id ? classroom : c
                ),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    deleteClassroom: async (id) => {
        set({ loading: true, error: null });
        try {
            await deleteClassroom(id);
            set((state) => ({
                classrooms: state.classrooms.filter((c) => c.id !== id),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    // Student actions
    loadStudentsByClassroom: async (classroomId) => {
        set({ loading: true, error: null });
        try {
            const data = await getStudentsByClassroomId(classroomId);
            set({ students: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    addNewStudent: async (student) => {
        set({ loading: true, error: null });
        try {
            const id = await addStudent(student);
            if (id) {
                const newStudent = { ...student, id };
                set((state) => ({
                    students: [...state.students, newStudent],
                    loading: false,
                }));
                return id;
            }
            set({ loading: false });
            return undefined;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return undefined;
        }
    },
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
            return undefined;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return undefined;
        }
    },
    updateExistingStudent: async (student) => {
        set({ loading: true, error: null });
        try {
            await updateStudent(student);
            set((state) => ({
                students: state.students.map((s) =>
                    s.id === student.id ? student : s
                ),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    removeStudent: async (id) => {
        set({ loading: true, error: null });
        try {
            await deleteStudent(id);
            set((state) => ({
                students: state.students.filter((s) => s.id !== id),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    // Evaluation Matrix actions
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
        set({ loading: true, error: null });
        try {
            const id = await addEvaluationMatrix(matrix);
            if (id) {
                const newMatrix = { ...matrix, id };
                set((state) => ({
                    evaluationMatrices: [...state.evaluationMatrices, newMatrix],
                    loading: false,
                }));
                return id;
            }
            set({ loading: false });
            return undefined;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return undefined;
        }
    },
    updateExistingMatrix: async (matrix) => {
        set({ loading: true, error: null });
        try {
            await updateMatrix(matrix);
            set((state) => ({
                evaluationMatrices: state.evaluationMatrices.map((m) =>
                    m.id === matrix.id ? matrix : m
                ),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    removeMatrix: async (id) => {
        set({ loading: true, error: null });
        try {
            await deleteMatrix(id);
            set((state) => ({
                evaluationMatrices: state.evaluationMatrices.filter((m) => m.id !== id),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    // Student Evaluation actions
    loadEvaluationsByMatrix: async (matrixId) => {
        set({ loading: true, error: null });
        try {
            const data = await getEvaluationsByMatrixId(matrixId);
            set({ studentEvaluations: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    addNewStudentEvaluation: async (evaluation) => {
        set({ loading: true, error: null });
        try {
            const id = await addStudentEvaluation(evaluation);
            if (id) {
                const newEvaluation = { ...evaluation, id };
                set((state) => ({
                    studentEvaluations: [...state.studentEvaluations, newEvaluation],
                    loading: false,
                }));
                return id;
            }
            set({ loading: false });
            return undefined;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return undefined;
        }
    },
    updateExistingStudentEvaluation: async (evaluation) => {
        set({ loading: true, error: null });
        try {
            await updateStudentEvaluation(evaluation);
            set((state) => ({
                studentEvaluations: state.studentEvaluations.map((e) =>
                    e.id === evaluation.id ? evaluation : e
                ),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    getStudentEvaluation: async (matrixId, studentId) => {
        set({ loading: true, error: null });
        try {
            const evaluation = await getStudentEvaluationByMatrixAndStudent(matrixId, studentId);
            set({ loading: false });
            return evaluation;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return undefined;
        }
    },
}));
