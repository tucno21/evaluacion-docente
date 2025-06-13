// src/lib/excel.ts
import * as XLSX from 'xlsx';
import type { Student } from '../types/types';


interface ExcelStudent {
    nombreCompleto: string;
    [key: string]: string | undefined;
}

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
