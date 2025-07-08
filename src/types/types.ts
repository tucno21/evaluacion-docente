// src/lib/types.ts
// src/lib/types.ts
export interface Classroom {
    id: string;
    name: string;
    grade: string;
    section: string;
    createdAt: string;
}

export interface Student {
    id: string;
    classroomId: string;
    fullName: string;
}

export interface EvaluationCriterion {
    id: string;
    name: string;
}

export type AchievementLevel = 'C' | 'B' | 'A' | 'AD';
export type ParticipationLevel = 'F' | 'C' | 'B' | 'B+' | 'A' | 'A+';

export interface EvaluationMatrix {
    id: string;
    classroomId: string;
    name: string;
    date: string;
    criteria: EvaluationCriterion[];
}

export interface CriterionEvaluation {
    criterionId: string;
    level: AchievementLevel;
}

export interface StudentEvaluation {
    id: string;
    studentId: string;
    matrixId: string;
    criteriaEvaluations: CriterionEvaluation[];
}

export interface ParticipationEvaluation {
    id: string;
    studentId: string;
    matrixId: string;
    level: ParticipationLevel;
}

// Type for form submissions
export type ClassroomFormData = Omit<Classroom, 'id' | 'createdAt'>;
export type StudentFormData = Omit<Student, 'id'>;
export type EvaluationMatrixFormData = Omit<EvaluationMatrix, 'id'>;
