// src/lib/types.ts
// src/lib/types.ts
export interface GradeSection {
    id: string;
    name: string;
    createdAt: string;
}

export interface Classroom {
    id: string;
    name: string;
    gradeSectionId: string;
    createdAt: string;
}

export interface Student {
    id: string;
    fullName: string;
    gradeSectionId: string;
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
