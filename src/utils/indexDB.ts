import type { Classroom, Student, EvaluationMatrix, StudentEvaluation } from "../types/types";

// IndexedDB configuration
const DB_NAME = 'teacher-evaluation-app';
const DB_VERSION = 1;
const STORES = {
    classrooms: 'classrooms',
    students: 'students',
    evaluationMatrices: 'evaluationMatrices',
    studentEvaluations: 'studentEvaluations'
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
                const classroomStore = db.createObjectStore(STORES.classrooms, { keyPath: 'id', autoIncrement: true });
                classroomStore.createIndex('name', 'name', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.students)) {
                const studentStore = db.createObjectStore(STORES.students, { keyPath: 'id', autoIncrement: true });
                studentStore.createIndex('classroomId', 'classroomId', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.evaluationMatrices)) {
                const matricesStore = db.createObjectStore(STORES.evaluationMatrices, { keyPath: 'id', autoIncrement: true });
                matricesStore.createIndex('classroomId', 'classroomId', { unique: false });
                matricesStore.createIndex('name', 'name', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.studentEvaluations)) {
                const evaluationsStore = db.createObjectStore(STORES.studentEvaluations, { keyPath: 'id', autoIncrement: true });
                evaluationsStore.createIndex('matrixId', 'matrixId', { unique: false });
                evaluationsStore.createIndex('studentId', 'studentId', { unique: false });
            }
        };
    });
};

// Generic function to add item to a store
export const addItem = <T>(storeName: string, item: T): Promise<number> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            const request = store.add(item);

            request.onsuccess = () => {
                resolve(request.result as number);
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
export const getItemById = <T>(storeName: string, id: number): Promise<T | undefined> => {
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
export const updateItem = <T>(storeName: string, item: T): Promise<void> => {
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
export const deleteItem = (storeName: string, id: number): Promise<void> => {
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
    value: string | number
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
export const addClassroom = (classroom: Omit<Classroom, 'id'>): Promise<number> => {
    return addItem<Omit<Classroom, 'id'>>(STORES.classrooms, classroom);
};

export const getAllClassrooms = (): Promise<Classroom[]> => {
    return getAllItems<Classroom>(STORES.classrooms);
};

export const getClassroomById = (id: number): Promise<Classroom | undefined> => {
    return getItemById<Classroom>(STORES.classrooms, id);
};

export const updateClassroom = (classroom: Classroom): Promise<void> => {
    return updateItem<Classroom>(STORES.classrooms, classroom);
};

export const deleteClassroom = (id: number): Promise<void> => {
    return deleteItem(STORES.classrooms, id);
};

// Student-specific functions
export const addStudent = (student: Omit<Student, 'id'>): Promise<number> => {
    return addItem<Omit<Student, 'id'>>(STORES.students, student);
};

export const addMultipleStudents = async (students: Omit<Student, 'id'>[]): Promise<number[]> => {
    const ids: number[] = [];

    for (const student of students) {
        const id = await addStudent(student);
        ids.push(id);
    }

    return ids;
};

export const getStudentsByClassroomId = (classroomId: number): Promise<Student[]> => {
    return getItemsByIndex<Student>(STORES.students, 'classroomId', classroomId);
};

export const updateStudent = (student: Student): Promise<void> => {
    return updateItem<Student>(STORES.students, student);
};

export const deleteStudent = (id: number): Promise<void> => {
    return deleteItem(STORES.students, id);
};

// Matrix-specific functions
export const addEvaluationMatrix = (matrix: Omit<EvaluationMatrix, 'id'>): Promise<number> => {
    return addItem<Omit<EvaluationMatrix, 'id'>>(STORES.evaluationMatrices, matrix);
};

export const getMatricesByClassroomId = (classroomId: number): Promise<EvaluationMatrix[]> => {
    return getItemsByIndex<EvaluationMatrix>(STORES.evaluationMatrices, 'classroomId', classroomId);
};

export const getMatrixById = (id: number): Promise<EvaluationMatrix | undefined> => {
    return getItemById<EvaluationMatrix>(STORES.evaluationMatrices, id);
};

export const updateMatrix = (matrix: EvaluationMatrix): Promise<void> => {
    return updateItem<EvaluationMatrix>(STORES.evaluationMatrices, matrix);
};

export const deleteMatrix = (id: number): Promise<void> => {
    return deleteItem(STORES.evaluationMatrices, id);
};

// Evaluation-specific functions
export const addStudentEvaluation = (evaluation: Omit<StudentEvaluation, 'id'>): Promise<number> => {
    return addItem<Omit<StudentEvaluation, 'id'>>(STORES.studentEvaluations, evaluation);
};

export const getEvaluationsByMatrixId = (matrixId: number): Promise<StudentEvaluation[]> => {
    return getItemsByIndex<StudentEvaluation>(STORES.studentEvaluations, 'matrixId', matrixId);
};

export const updateStudentEvaluation = (evaluation: StudentEvaluation): Promise<void> => {
    return updateItem<StudentEvaluation>(STORES.studentEvaluations, evaluation);
};

export const getStudentEvaluationByMatrixAndStudent = async (
    matrixId: number,
    studentId: number
): Promise<StudentEvaluation | undefined> => {
    const evaluations = await getEvaluationsByMatrixId(matrixId);
    return evaluations.find(evaluation => evaluation.studentId === studentId);
};
