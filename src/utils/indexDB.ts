import { v4 as uuidv4 } from 'uuid';
import type { Classroom, Student, EvaluationMatrix, StudentEvaluation, ParticipationEvaluation } from "../types/types";

// IndexedDB configuration
const DB_NAME = 'teacher-evaluation-app';
const DB_VERSION = 2;
const STORES = {
    classrooms: 'classrooms',
    students: 'students',
    evaluationMatrices: 'evaluationMatrices',
    studentEvaluations: 'studentEvaluations',
    participationEvaluations: 'participationEvaluations' // New store
};

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains(STORES.classrooms)) {
                const classroomStore = db.createObjectStore(STORES.classrooms, { keyPath: 'id' });
                classroomStore.createIndex('name', 'name', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.students)) {
                const studentStore = db.createObjectStore(STORES.students, { keyPath: 'id' });
                studentStore.createIndex('classroomId', 'classroomId', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.evaluationMatrices)) {
                const matricesStore = db.createObjectStore(STORES.evaluationMatrices, { keyPath: 'id' });
                matricesStore.createIndex('classroomId', 'classroomId', { unique: false });
                matricesStore.createIndex('name', 'name', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.studentEvaluations)) {
                const evaluationsStore = db.createObjectStore(STORES.studentEvaluations, { keyPath: 'id' });
                evaluationsStore.createIndex('matrixId', 'matrixId', { unique: false });
                evaluationsStore.createIndex('studentId', 'studentId', { unique: false });
            }

            // New store for participation evaluations
            if (!db.objectStoreNames.contains(STORES.participationEvaluations)) {
                const participationStore = db.createObjectStore(STORES.participationEvaluations, { keyPath: 'id' });
                participationStore.createIndex('matrixId', 'matrixId', { unique: false });
                participationStore.createIndex('studentId', 'studentId', { unique: false });
            }
        };
    });
};

// Generic function to add item to a store
export const addItem = <T extends { id?: string }>(storeName: string, item: T): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            const itemToAdd = { ...item, id: item.id || uuidv4() };

            const request = store.add(itemToAdd);

            request.onsuccess = () => {
                resolve(itemToAdd.id as string);
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            reject(error);
        }
    });
};

// Generic function to get all items from a store
export const getAllItems = <T>(storeName: string): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);

            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result as T[]);
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            reject(error);
        }
    });
};

// Get item by id from a store
export const getItemById = <T>(storeName: string, id: string): Promise<T | undefined> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);

            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result as T);
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            reject(error);
        }
    });
};

// Update item in a store
export const updateItem = <T extends { id: string }>(storeName: string, item: T): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            const request = store.put(item);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            reject(error);
        }
    });
};

// Delete item from a store
export const deleteItem = (storeName: string, id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            reject(error);
        }
    });
};

// Get items by index value
export const getItemsByIndex = <T>(
    storeName: string,
    indexName: string,
    value: string
): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);

            const request = index.getAll(IDBKeyRange.only(value));

            request.onsuccess = () => {
                resolve(request.result as T[]);
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            reject(error);
        }
    });
};

// Classroom-specific functions
export const addClassroom = (classroom: Omit<Classroom, 'id'>): Promise<string> => {
    return addItem<Classroom>(STORES.classrooms, classroom as Classroom);
};

export const getAllClassrooms = (): Promise<Classroom[]> => {
    return getAllItems<Classroom>(STORES.classrooms);
};

export const getClassroomById = (id: string): Promise<Classroom | undefined> => {
    return getItemById<Classroom>(STORES.classrooms, id);
};

export const updateClassroom = (classroom: Classroom): Promise<void> => {
    return updateItem<Classroom>(STORES.classrooms, classroom);
};

export const deleteClassroom = (id: string): Promise<void> => {
    return deleteItem(STORES.classrooms, id);
};

// Student-specific functions
export const addStudent = (student: Omit<Student, 'id'>): Promise<string> => {
    return addItem<Student>(STORES.students, student as Student);
};

export const addMultipleStudents = async (students: Omit<Student, 'id'>[]): Promise<string[]> => {
    const ids: string[] = [];

    for (const student of students) {
        const id = await addStudent(student);
        ids.push(id);
    }

    return ids;
};

export const getStudentsByClassroomId = (classroomId: string): Promise<Student[]> => {
    return getItemsByIndex<Student>(STORES.students, 'classroomId', classroomId);
};

export const updateStudent = (student: Student): Promise<void> => {
    return updateItem<Student>(STORES.students, student);
};

export const deleteStudent = (id: string): Promise<void> => {
    return deleteItem(STORES.students, id);
};

// Matrix-specific functions
export const addEvaluationMatrix = (matrix: Omit<EvaluationMatrix, 'id'>): Promise<string> => {
    return addItem<EvaluationMatrix>(STORES.evaluationMatrices, matrix as EvaluationMatrix);
};

export const getMatricesByClassroomId = (classroomId: string): Promise<EvaluationMatrix[]> => {
    return getItemsByIndex<EvaluationMatrix>(STORES.evaluationMatrices, 'classroomId', classroomId);
};

export const getMatrixById = (id: string): Promise<EvaluationMatrix | undefined> => {
    return getItemById<EvaluationMatrix>(STORES.evaluationMatrices, id);
};

export const updateMatrix = (matrix: EvaluationMatrix): Promise<void> => {
    return updateItem<EvaluationMatrix>(STORES.evaluationMatrices, matrix);
};

export const deleteMatrix = (id: string): Promise<void> => {
    return deleteItem(STORES.evaluationMatrices, id);
};

// Evaluation-specific functions
export const addStudentEvaluation = (evaluation: Omit<StudentEvaluation, 'id'>): Promise<string> => {
    return addItem<StudentEvaluation>(STORES.studentEvaluations, evaluation as StudentEvaluation);
};

export const getEvaluationsByMatrixId = (matrixId: string): Promise<StudentEvaluation[]> => {
    return getItemsByIndex<StudentEvaluation>(STORES.studentEvaluations, 'matrixId', matrixId);
};

export const updateStudentEvaluation = (evaluation: StudentEvaluation): Promise<void> => {
    return updateItem<StudentEvaluation>(STORES.studentEvaluations, evaluation);
};

export const getStudentEvaluationByMatrixAndStudent = async (
    matrixId: string,
    studentId: string
): Promise<StudentEvaluation | undefined> => {
    const evaluations = await getEvaluationsByMatrixId(matrixId);
    return evaluations.find(evaluation => evaluation.studentId === studentId);
};

// Participation-specific functions
export const addParticipationEvaluation = (evaluation: Omit<ParticipationEvaluation, 'id'>): Promise<string> => {
    return addItem<ParticipationEvaluation>(STORES.participationEvaluations, evaluation as ParticipationEvaluation);
};

export const getParticipationEvaluationsByMatrixId = (matrixId: string): Promise<ParticipationEvaluation[]> => {
    return getItemsByIndex<ParticipationEvaluation>(STORES.participationEvaluations, 'matrixId', matrixId);
};

export const updateParticipationEvaluation = (evaluation: ParticipationEvaluation): Promise<void> => {
    return updateItem<ParticipationEvaluation>(STORES.participationEvaluations, evaluation);
};

export const getParticipationEvaluationByMatrixAndStudent = async (
    matrixId: string,
    studentId: string
): Promise<ParticipationEvaluation | undefined> => {
    const evaluations = await getParticipationEvaluationsByMatrixId(matrixId);
    return evaluations.find(evaluation => evaluation.studentId === studentId);
};

// Global Get All functions for Excel Export
export const getAllEvaluationMatrices = (): Promise<EvaluationMatrix[]> => {
    return getAllItems<EvaluationMatrix>(STORES.evaluationMatrices);
};

export const getAllStudentEvaluations = (): Promise<StudentEvaluation[]> => {
    return getAllItems<StudentEvaluation>(STORES.studentEvaluations);
};

export const getAllParticipationEvaluations = (): Promise<ParticipationEvaluation[]> => {
    return getAllItems<ParticipationEvaluation>(STORES.participationEvaluations);
};
