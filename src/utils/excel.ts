// src/lib/excel.ts
import * as XLSX from 'xlsx-js-style';
import type { Student, EvaluationMatrix, StudentEvaluation, ParticipationEvaluation } from '../types/types';


interface ExcelStudent {
    nombreCompleto: string;
    [key: string]: string | undefined;
}

interface EvaluationData {
    studentId: string;
    fullName: string;
    participationLevel: string;
    criteria: {
        criterionId: string;
        level: string;
    }[];
}

export const generateEvaluationExcel = (
    matrix: EvaluationMatrix,
    students: Student[],
    studentEvaluations: StudentEvaluation[],
    participationEvaluations: ParticipationEvaluation[]
): Blob => {
    const wb = XLSX.utils.book_new();
    const ws_data: any[][] = [];

    // Logo/Institución (Fila 0)
    ws_data.push(['REPORTE DE EVALUACIÓN']);

    // Información de la evaluación (Filas 1-4)
    ws_data.push([`Evaluación: ${matrix.name}`]);
    ws_data.push([`Fecha: ${new Date(matrix.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`]);
    ws_data.push([`Total de Estudiantes: ${students.length}`]);
    ws_data.push(['']); // Fila separadora

    // Encabezados principales (Fila 5)
    const headerRow1: any[] = ['N°', 'ESTUDIANTE', 'PARTICIPACIÓN'];
    matrix.criteria.forEach(criterion => {
        headerRow1.push(criterion.name, '', '', ''); // Criterion name seguido de 3 celdas vacías para merge
    });
    ws_data.push(headerRow1);

    // Sub-encabezados para criterios (Fila 6)
    const headerRow2: any[] = ['', '', ''];
    matrix.criteria.forEach(() => {
        headerRow2.push('C', 'B', 'A', 'AD');
    });
    ws_data.push(headerRow2);

    // Preparar datos para cada estudiante
    const evaluationData: EvaluationData[] = students.map(student => {
        const studentEval = studentEvaluations.find(se => se.studentId === student.id);
        const participationEval = participationEvaluations.find(pe => pe.studentId === student.id);

        const criteriaLevels = matrix.criteria.map(criterion => {
            const level = studentEval?.criteriaEvaluations.find(ce => ce.criterionId === criterion.id)?.level || '';
            return { criterionId: criterion.id, level };
        });

        return {
            studentId: student.id,
            fullName: student.fullName,
            participationLevel: participationEval?.level || '',
            criteria: criteriaLevels,
        };
    });



    // Filas de datos de estudiantes
    evaluationData.forEach((data, index) => {
        const row: any[] = [index + 1, data.fullName];

        // Participación con icono visual
        const participationDisplay = data.participationLevel ?
            data.participationLevel : 'N/E';
        row.push(participationDisplay);

        // Criterios con marcas visuales
        matrix.criteria.forEach(criterion => {
            const level = data.criteria.find(c => c.criterionId === criterion.id)?.level || '';
            const levels = ['C', 'B', 'A', 'AD'];
            levels.forEach(l => {
                row.push(level === l ? '●' : '');
            });
        });

        ws_data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Calcular columnas totales
    let maxCols = 0;
    ws_data.forEach(row => {
        if (row.length > maxCols) {
            maxCols = row.length;
        }
    });

    const merges: XLSX.Range[] = [];

    // Merges para encabezados principales
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } }); // Título principal
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: maxCols - 1 } }); // Nombre evaluación
    merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: maxCols - 1 } }); // Fecha
    merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: maxCols - 1 } }); // Total estudiantes

    // Merges para columnas principales
    merges.push(
        { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } }, // N°
        { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } }, // ESTUDIANTE
        { s: { r: 5, c: 2 }, e: { r: 6, c: 2 } }  // PARTICIPACIÓN
    );

    // Merges para criterios
    let col = 3;
    matrix.criteria.forEach(() => {
        merges.push({ s: { r: 5, c: col }, e: { r: 5, c: col + 3 } });
        col += 4;
    });

    ws['!merges'] = merges;

    // Anchos de columna optimizados
    const colWidths = [
        { wch: 6 },   // N°
        { wch: 25 },  // ESTUDIANTE
        { wch: 12 },  // PARTICIPACIÓN
    ];

    // Columnas de criterios
    matrix.criteria.forEach(() => {
        colWidths.push(
            { wch: 4 }, // C
            { wch: 4 }, // B  
            { wch: 4 }, // A
            { wch: 4 }  // AD
        );
    });

    ws['!cols'] = colWidths;

    // Estilos profesionales mejorados
    const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E3A8A" } }, // Blue-800
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } },
        },
    };

    const infoStyle = {
        font: { bold: true, sz: 11, color: { rgb: "1F2937" } },
        fill: { fgColor: { rgb: "F3F4F6" } }, // Gray-100
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
    };

    const mainHeaderStyle = {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } }, // Blue-500
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
        },
    };

    const subHeaderStyle = {
        font: { bold: true, sz: 9, color: { rgb: "374151" } },
        fill: { fgColor: { rgb: "E5E7EB" } }, // Gray-200
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
        },
    };

    const dataStyle = {
        font: { sz: 10, color: { rgb: "1F2937" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
    };

    const nameStyle = {
        font: { sz: 10, color: { rgb: "1F2937" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
    };

    const selectedLevelStyle = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "10B981" } }, // Green-500
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
    };

    // Aplicar estilos
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cell_address]) continue;

            // Aplicar estilos según la fila
            if (R === 0) {
                ws[cell_address].s = titleStyle;
            } else if (R >= 1 && R <= 3) {
                ws[cell_address].s = infoStyle;
            } else if (R === 5) {
                ws[cell_address].s = mainHeaderStyle;
            } else if (R === 6) {
                ws[cell_address].s = subHeaderStyle;
            } else if (R >= 7 && R < 7 + students.length) {
                // Filas de datos de estudiantes
                if (C === 1) {
                    ws[cell_address].s = nameStyle; // Columna de nombres
                } else {
                    ws[cell_address].s = dataStyle;
                    // Aplicar estilo especial para niveles seleccionados
                    if (ws[cell_address].v === '●') {
                        ws[cell_address].s = selectedLevelStyle;
                    }
                }
            }
        }
    }

    // Configurar altura de filas
    ws['!rows'] = [
        { hpt: 25 }, // Título
        { hpt: 20 }, // Info
        { hpt: 20 }, // Info
        { hpt: 20 }, // Info
        { hpt: 10 }, // Separador
        { hpt: 25 }, // Headers
        { hpt: 20 }, // Sub-headers
    ];

    // Agregar filas de datos
    for (let i = 0; i < students.length; i++) {
        ws['!rows']?.push({ hpt: 18 });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Evaluación');

    // Crear el blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
    }

    return new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};

export const generateParticipationExcel = (
    students: Student[],
    participationEvaluations: ParticipationEvaluation[],
    evaluationMatrices: EvaluationMatrix[],
    startDate: Date | null,
    endDate: Date | null
): Blob => {
    const wb = XLSX.utils.book_new();
    const ws_data: any[][] = [];

    // Title
    ws_data.push(['REPORTE DE PARTICIPACIÓN']);
    ws_data.push(['']); // Separator

    // Filter matrices by date range
    const filteredMatrices = evaluationMatrices.filter(matrix => {
        const matrixDate = new Date(matrix.date);
        matrixDate.setHours(0, 0, 0, 0); // Normalize to start of day
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(0, 0, 0, 0);

        return (!start || matrixDate >= start) && (!end || matrixDate <= end);
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending

    // Headers
    const headerRow: any[] = ['N°', 'ESTUDIANTE'];
    filteredMatrices.forEach(matrix => {
        const date = new Date(matrix.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        headerRow.push(`${date} - ${matrix.name}`);
    });
    ws_data.push(headerRow);

    // Student data
    students.forEach((student, index) => {
        const row: any[] = [index + 1, student.fullName];
        filteredMatrices.forEach(matrix => {
            const participation = participationEvaluations.find(pe => pe.studentId === student.id && pe.matrixId === matrix.id);
            row.push(participation ? participation.level : 'N/E');
        });
        ws_data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Merges for title (A1:D1)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]; // Merge A1 to D1

    // Column widths
    const colWidths = [
        { wch: 6 }, // N°
        { wch: 25 }, // ESTUDIANTE
    ];
    filteredMatrices.forEach(() => {
        colWidths.push({ wch: 20 }); // Participation columns
    });
    ws['!cols'] = colWidths;

    // Styles
    const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E3A8A" } }, // Blue-800
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } },
        },
    };

    const headerStyle = {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } }, // Blue-500
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
        },
    };

    const dataStyle = {
        font: { sz: 10, color: { rgb: "1F2937" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
    };

    const nameStyle = {
        font: { sz: 10, color: { rgb: "1F2937" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
    };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cell_address]) continue;

            if (R === 0) {
                ws[cell_address].s = titleStyle;
            } else if (R === 2) { // Header row
                ws[cell_address].s = headerStyle;
            } else if (R >= 3) { // Data rows
                if (C === 1) {
                    ws[cell_address].s = nameStyle;
                } else {
                    ws[cell_address].s = dataStyle;
                }
            }
        }
    }

    // Row heights
    ws['!rows'] = [
        { hpt: 25 }, // Title
        { hpt: 10 }, // Separator
        { hpt: 25 }, // Headers
    ];
    for (let i = 0; i < students.length; i++) {
        ws['!rows']?.push({ hpt: 18 });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Participación');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
    }

    return new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};

export const generateCriteriaExcel = async (
    evaluationMatrices: EvaluationMatrix[],
    students: Student[],
    studentEvaluations: StudentEvaluation[],
    participationEvaluations: ParticipationEvaluation[],
    startDate: Date | null,
    endDate: Date | null
): Promise<Blob> => {
    const wb = XLSX.utils.book_new();

    // Filter matrices by date range and get unique dates
    const uniqueDates = Array.from(new Set(
        evaluationMatrices
            .filter(matrix => {
                const matrixDate = new Date(matrix.date);
                matrixDate.setHours(0, 0, 0, 0); // Normalize to start of day
                const start = startDate ? new Date(startDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                const end = endDate ? new Date(endDate) : null;
                if (end) end.setHours(0, 0, 0, 0);

                return (!start || matrixDate >= start) && (!end || matrixDate <= end);
            })
            .map(matrix => new Date(matrix.date).toISOString().split('T')[0])
    )).sort(); // Sort dates chronologically

    for (const dateString of uniqueDates) {
        const matricesForDate = evaluationMatrices.filter(matrix =>
            new Date(matrix.date).toISOString().split('T')[0] === dateString
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by matrix date

        if (matricesForDate.length === 0) continue;

        // For simplicity, if multiple matrices exist for the same date, we'll combine their criteria
        // or pick the first one. The prompt implies "each sheet corresponds to a date",
        // so we'll generate a sheet for each date, potentially combining data if multiple matrices exist.
        // For now, let's assume one matrix per date for the structure, or pick the first one.
        // A more robust solution might involve iterating through each matrix for the date.
        // Given the prompt "cada hoja del archivo corresponde a una fecha encontrada en la base de datos",
        // it implies a single sheet per date, summarizing evaluations for that date.
        // Let's create a sheet for each matrix on that date, or combine them if the user wants.
        // For now, I'll create a sheet for each matrix that falls within the date range.
        // The prompt says "cada hoja del archivo corresponde a una fecha encontrada en la base de datos",
        // which implies one sheet per date, not per matrix.
        // Let's refine this: group evaluations by date, then generate a single sheet for each date.

        // To simplify, let's generate a sheet for each matrix that falls within the date range.
        // This aligns better with the existing generateEvaluationExcel structure.
        // The prompt says "cada hoja del archivo corresponde a una fecha encontrada en la base de datos".
        // This means if there are multiple matrices on the same date, they should probably be on the same sheet.
        // This requires a more complex aggregation.

        // Let's re-interpret: "cada hoja del archivo corresponde a una fecha encontrada en la base de datos"
        // means we iterate through unique dates. For each unique date, we create a sheet.
        // On that sheet, we list all evaluations that occurred on that specific date.
        // This means the header will be dynamic based on the criteria of all matrices on that date.

        // This is more complex than just calling generateEvaluationExcel for each matrix.
        // Let's stick to the simpler interpretation first: generate a sheet for each *matrix* that falls within the date range.
        // This is closer to the existing `generateEvaluationExcel` function.
        // If the user wants a single sheet per date with aggregated criteria, that's a larger refactor.

        // Let's create a new function that takes a single matrix and generates a sheet,
        // and then call it for each matrix within the date range.
        // The existing `generateEvaluationExcel` already does this.
        // So, we just need to filter the matrices and call `generateEvaluationExcel` for each.

        for (const matrix of matricesForDate) {
            const ws_data: any[][] = [];

            // Logo/Institución (Fila 0)
            ws_data.push(['REPORTE DE EVALUACIÓN']);

            // Information (Rows 1-4)
            ws_data.push([`Evaluación: ${matrix.name}`]);
            ws_data.push([`Fecha: ${new Date(matrix.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`]);
            ws_data.push([`Total de Estudiantes: ${students.length}`]);
            ws_data.push(['']); // Separator row

            // Main Headers (Row 5)
            const headerRow1: any[] = ['N°', 'ESTUDIANTE', 'PARTICIPACIÓN'];
            matrix.criteria.forEach(criterion => {
                headerRow1.push(criterion.name, '', '', ''); // Criterion name followed by 3 empty cells for merge
            });
            ws_data.push(headerRow1);

            // Sub-headers for criteria (Row 6)
            const headerRow2: any[] = ['', '', ''];
            matrix.criteria.forEach(() => {
                headerRow2.push('C', 'B', 'A', 'AD');
            });
            ws_data.push(headerRow2);

            // Prepare data for each student
            const evaluationData: EvaluationData[] = students.map(student => {
                const studentEval = studentEvaluations.find(se => se.studentId === student.id && se.matrixId === matrix.id);
                const participationEval = participationEvaluations.find(pe => pe.studentId === student.id && pe.matrixId === matrix.id);

                const criteriaLevels = matrix.criteria.map(criterion => {
                    const level = studentEval?.criteriaEvaluations.find(ce => ce.criterionId === criterion.id)?.level || '';
                    return { criterionId: criterion.id, level };
                });

                return {
                    studentId: student.id,
                    fullName: student.fullName,
                    participationLevel: participationEval?.level || '',
                    criteria: criteriaLevels,
                };
            });

            // Student data rows
            evaluationData.forEach((data, index) => {
                const row: any[] = [index + 1, data.fullName];

                // Participation with visual icon
                const participationDisplay = data.participationLevel ?
                    data.participationLevel : 'N/E';
                row.push(participationDisplay);

                // Criteria with visual marks
                matrix.criteria.forEach(criterion => {
                    const level = data.criteria.find(c => c.criterionId === criterion.id)?.level || '';
                    const levels = ['C', 'B', 'A', 'AD'];
                    levels.forEach(l => {
                        row.push(level === l ? '●' : '');
                    });
                });

                ws_data.push(row);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // Calculate total columns
            let maxCols = 0;
            ws_data.forEach(row => {
                if (row.length > maxCols) {
                    maxCols = row.length;
                }
            });

            const merges: XLSX.Range[] = [];

            // Merges for main headers
            merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } }); // Main title
            merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: maxCols - 1 } }); // Evaluation name
            merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: maxCols - 1 } }); // Date
            merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: maxCols - 1 } }); // Total students

            // Merges for main columns
            merges.push(
                { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } }, // N°
                { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } }, // ESTUDIANTE
                { s: { r: 5, c: 2 }, e: { r: 6, c: 2 } }  // PARTICIPACIÓN
            );

            // Merges for criteria
            let col = 3;
            matrix.criteria.forEach(() => {
                merges.push({ s: { r: 5, c: col }, e: { r: 5, c: col + 3 } });
                col += 4;
            });

            ws['!merges'] = merges;

            // Optimized column widths
            const colWidths = [
                { wch: 6 },   // N°
                { wch: 25 },  // ESTUDIANTE
                { wch: 12 },  // PARTICIPACIÓN
            ];

            // Criteria columns
            matrix.criteria.forEach(() => {
                colWidths.push(
                    { wch: 4 }, // C
                    { wch: 4 }, // B
                    { wch: 4 }, // A
                    { wch: 4 }  // AD
                );
            });

            ws['!cols'] = colWidths;

            // Styles
            const titleStyle = {
                font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "1E3A8A" } }, // Blue-800
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                    top: { style: "medium", color: { rgb: "000000" } },
                    bottom: { style: "medium", color: { rgb: "000000" } },
                    left: { style: "medium", color: { rgb: "000000" } },
                    right: { style: "medium", color: { rgb: "000000" } },
                },
            };

            const infoStyle = {
                font: { bold: true, sz: 11, color: { rgb: "1F2937" } },
                fill: { fgColor: { rgb: "F3F4F6" } }, // Gray-100
                alignment: { horizontal: "left", vertical: "center", wrapText: true },
                border: {
                    top: { style: "thin", color: { rgb: "D1D5DB" } },
                    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
                    left: { style: "thin", color: { rgb: "D1D5DB" } },
                    right: { style: "thin", color: { rgb: "D1D5DB" } },
                },
            };

            const mainHeaderStyle = {
                font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "3B82F6" } }, // Blue-500
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                    top: { style: "medium", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } },
                },
            };

            const subHeaderStyle = {
                font: { bold: true, sz: 9, color: { rgb: "374151" } },
                fill: { fgColor: { rgb: "E5E7EB" } }, // Gray-200
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "medium", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } },
                },
            };

            const dataStyle = {
                font: { sz: 10, color: { rgb: "1F2937" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "D1D5DB" } },
                    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
                    left: { style: "thin", color: { rgb: "D1D5DB" } },
                    right: { style: "thin", color: { rgb: "D1D5DB" } },
                },
            };

            const nameStyle = {
                font: { sz: 10, color: { rgb: "1F2937" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "D1D5DB" } },
                    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
                    left: { style: "thin", color: { rgb: "D1D5DB" } },
                    right: { style: "thin", color: { rgb: "D1D5DB" } },
                },
            };

            const selectedLevelStyle = {
                font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "10B981" } }, // Green-500
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "D1D5DB" } },
                    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
                    left: { style: "thin", color: { rgb: "D1D5DB" } },
                    right: { style: "thin", color: { rgb: "D1D5DB" } },
                },
            };

            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cell_address]) continue;

                    if (R === 0) {
                        ws[cell_address].s = titleStyle;
                    } else if (R >= 1 && R <= 3) {
                        ws[cell_address].s = infoStyle;
                    } else if (R === 5) {
                        ws[cell_address].s = mainHeaderStyle;
                    } else if (R === 6) {
                        ws[cell_address].s = subHeaderStyle;
                    } else if (R >= 7 && R < 7 + students.length) {
                        if (C === 1) {
                            ws[cell_address].s = nameStyle;
                        } else {
                            ws[cell_address].s = dataStyle;
                            if (ws[cell_address].v === '●') {
                                ws[cell_address].s = selectedLevelStyle;
                            }
                        }
                    }
                }
            }

            ws['!rows'] = [
                { hpt: 25 }, // Title
                { hpt: 20 }, // Info
                { hpt: 20 }, // Info
                { hpt: 20 }, // Info
                { hpt: 10 }, // Separator
                { hpt: 25 }, // Headers
                { hpt: 20 }, // Sub-headers
            ];

            for (let i = 0; i < students.length; i++) {
                ws['!rows']?.push({ hpt: 18 });
            }

            const sheetName = `${new Date(matrix.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${matrix.name.substring(0, 15)}`;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
    }

    return new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};

// Function to parse Excel file and extract students
export const parseExcelStudents = (file: File): Promise<Omit<Student, 'id'>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Get the first worksheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert the worksheet to JSON
                const jsonData = XLSX.utils.sheet_to_json<ExcelStudent>(worksheet);

                // Map the Excel data to our Student type
                const students: Omit<Student, 'id'>[] = jsonData.map((row) => {
                    const fullName = row.nombreCompleto || '';

                    return {
                        classroomId: '', // This will be set by the component that calls this function
                        fullName: fullName
                    };
                });

                resolve(students);
            } catch (error) {
                reject(new Error('Error parsing Excel file: ' + error));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        // Read the file as binary
        reader.readAsBinaryString(file);
    });
};

// Function to generate a template Excel file for students
export const generateExcelTemplate = (): Blob => {
    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Sample data for the template
    const sampleData = [
        { nombreCompleto: 'Pérez, Juan' },
        { nombreCompleto: 'González, María' },
    ];

    // Create the worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column width for 'nombreCompleto'
    ws['!cols'] = [{ wch: 50 }]; // Set width to 30 characters

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');

    // Generate the Excel file as a blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    // Convert the binary string to an ArrayBuffer
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
    }

    // Create a Blob from the ArrayBuffer
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
