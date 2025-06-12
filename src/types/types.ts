// src/lib/types.ts
export interface Classroom {
    id: number;
    name: string;
    grade: string;
    section: string;
    createdAt: string;
}

export interface Student {
    id: number;
    classroomId: number;
    name: string;
    lastName: string;
    fullName: string; // Computed name + lastName for display
}

export interface EvaluationCriterion {
    id: number;
    name: string;
}

export type AchievementLevel = 'C' | 'B' | 'A' | 'AD';

export interface EvaluationMatrix {
    id: number;
    classroomId: number;
    name: string;
    date: string;
    criteria: EvaluationCriterion[];
}

export interface CriterionEvaluation {
    criterionId: number;
    level: AchievementLevel;
}

export interface StudentEvaluation {
    id: number;
    studentId: number;
    matrixId: number;
    criteriaEvaluations: CriterionEvaluation[];
}

// Type for form submissions
export type ClassroomFormData = Omit<Classroom, 'id' | 'createdAt'>;
export type StudentFormData = Omit<Student, 'id' | 'fullName'>;
export type EvaluationMatrixFormData = Omit<EvaluationMatrix, 'id'>;