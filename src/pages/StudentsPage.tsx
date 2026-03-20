import React, { useState, useEffect } from 'react';
import { Users, Download, Upload, X, FileSpreadsheet, Search } from 'lucide-react';
import { generateExcelTemplate, parseExcelStudents } from '../utils/excel';
import { saveAs } from 'file-saver';
import { useAppStore } from '../store/useAppStore';
import { useHeaderStore } from '../store/useHeaderStore';
import type { Student } from '../types/types';
import type { GradeSection } from '../types/types';
import ModalAlert from '../components/ModalAlert';
import Inputs from '../components/Inputs';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { Trash2, UserPlus, Edit } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getAllGradeSections } from '../utils/indexDB';

const StudentsPage = () => {
    const {
        students,
        gradeSections,
        loadAllStudents,
        loadGradeSections,
        addManyStudents,
        removeStudent,
        addStudent,
        updateExistingStudent,
        addNewGradeSection,
        getGradeSectionByName
    } = useAppStore();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGradoSec, setSelectedGradoSec] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { setHeaderTitle } = useHeaderStore();

    // State for Toast notifications
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // State for delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    // State for register/edit student modal
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentGradoSec, setNewStudentGradoSec] = useState('');
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            // Cargar GradeSections y estudiantes
            setHeaderTitle('Todos los Estudiantes');
            await loadGradeSections();
            await loadAllStudents();
        };

        fetchData();
    }, [loadAllStudents, loadGradeSections, setHeaderTitle]);

    // Get unique gradeSections from loaded gradeSections
    const uniqueGradeSections = gradeSections.sort((a, b) => a.name.localeCompare(b.name));

    // Helper function to get gradeSection name from ID
    const getGradeSectionName = (gradeSectionId: string) => {
        const gradeSection = gradeSections.find(gs => gs.id === gradeSectionId);
        return gradeSection ? gradeSection.name : 'Sin asignar';
    };

    const sortedAndFilteredStudents = students
        .filter(student => {
            const gradeSectionName = getGradeSectionName(student.gradeSectionId);
            const matchesGradoSec = gradeSectionName === selectedGradoSec;
            const matchesSearch = `${student.fullName}`.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesGradoSec && matchesSearch;
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const handleFilterByGradoSec = (gradoSec: string) => {
        setSelectedGradoSec(gradoSec);
    };

    const handleDownloadTemplate = () => {
        const excelBlob = generateExcelTemplate();
        saveAs(excelBlob, 'Plantilla_Estudiantes.xlsx');
    };

    const handleFileSelect = (file: File) => {
        if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            setSelectedFile(file);
        } else {
            setToast({ message: 'Por favor selecciona un archivo Excel válido (.xlsx)', type: 'error' });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleImportStudents = async () => {
        if (!selectedFile) {
            setToast({ message: 'Por favor selecciona un archivo Excel.', type: 'error' });
            return;
        }

        setIsProcessing(true);

        try {
            const { students: importedStudents, uniqueGradeSecs: importedGradeSecNames } = await parseExcelStudents(selectedFile);

            // Create GradeSections that don't exist
            for (const gradeSecName of importedGradeSecNames) {
                const existingGradeSection = await getGradeSectionByName(gradeSecName);
                if (!existingGradeSection) {
                    await addNewGradeSection({
                        name: gradeSecName,
                        createdAt: new Date().toISOString()
                    });
                }
            }

            // Get gradeSections directly from indexDB instead of relying on Zustand state
            const allGradeSections: GradeSection[] = await getAllGradeSections();

            // Convert students to use gradeSectionId
            const studentsWithGradeSectionIds = importedStudents.map(importedStudent => {
                const gradeSection = allGradeSections.find(gs => gs.name === importedStudent.gradoSec);
                return {
                    fullName: importedStudent.fullName,
                    gradeSectionId: gradeSection ? gradeSection.id : ''
                };
            });

            // Check for duplicates by fullName and gradeSectionId
            const duplicateCount = studentsWithGradeSectionIds.filter(imported => {
                return students.some(existing => {
                    const nameMatch = existing.fullName.trim().toLowerCase() === imported.fullName.trim().toLowerCase();
                    const gradeSectionIdMatch = existing.gradeSectionId === imported.gradeSectionId;
                    return nameMatch && gradeSectionIdMatch;
                });
            }).length;

            // Filter out duplicates
            const uniqueStudents = studentsWithGradeSectionIds.filter(imported => {
                return !students.some(existing => {
                    const nameMatch = existing.fullName.trim().toLowerCase() === imported.fullName.trim().toLowerCase();
                    const gradeSectionIdMatch = existing.gradeSectionId === imported.gradeSectionId;
                    return nameMatch && gradeSectionIdMatch;
                });
            });

            if (duplicateCount > 0 && uniqueStudents.length === 0) {
                setIsProcessing(false);
                setToast({
                    message: `Todos los estudiantes del archivo ya existen en la base de datos. No se importaron estudiantes duplicados.`,
                    type: 'error'
                });
                closeImportModal();
                return;
            }

            await addManyStudents(uniqueStudents);

            setIsProcessing(false);
            closeImportModal();

            if (duplicateCount > 0) {
                setToast({
                    message: `Se importaron ${uniqueStudents.length} estudiantes nuevos. ${duplicateCount} estudiantes ya existían y no se duplicaron.`,
                    type: 'success'
                });
            } else {
                setToast({ message: `Se importaron ${uniqueStudents.length} estudiantes correctamente.`, type: 'success' });
            }

            // Reload data
            await loadAllStudents();
        } catch (error) {
            console.error('Error al importar estudiantes:', error);
            setToast({ message: 'Error al importar estudiantes: ' + error, type: 'error' });
            setIsProcessing(false);
        }
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        setSelectedFile(null);
        setIsDragOver(false);
        setIsProcessing(false);
    };

    // Delete student functions
    const handleDeleteStudent = (student: Student) => {
        setStudentToDelete(student);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteStudent = async () => {
        if (studentToDelete) {
            try {
                await removeStudent(studentToDelete.id);
                closeDeleteModal();
                setToast({ message: `Estudiante ${studentToDelete.fullName} eliminado correctamente.`, type: 'success' });
            } catch (error) {
                console.error('Error al eliminar estudiante:', error);
                setToast({ message: 'Error al eliminar estudiante: ' + error, type: 'error' });
            }
        }
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
    };

    // Open edit modal
    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setNewStudentName(student.fullName);
        setNewStudentGradoSec(getGradeSectionName(student.gradeSectionId));
        setRegisterErrors({});
        setIsRegisterModalOpen(true);
    };

    // Register/Edit student functions
    const validateRegisterForm = () => {
        const newErrors: Record<string, string> = {};
        if (!newStudentName.trim()) {
            newErrors.fullName = 'El nombre del estudiante no puede estar vacío.';
        }
        if (!newStudentGradoSec.trim()) {
            newErrors.gradeSection = 'El grado y sección son obligatorios.';
        }
        setRegisterErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegisterStudent = async () => {
        if (!validateRegisterForm()) {
            return;
        }

        setIsProcessing(true);
        try {
            // Find or create GradeSection
            let gradeSectionId = editingStudent ? editingStudent.gradeSectionId : '';

            if (!editingStudent || newStudentGradoSec !== getGradeSectionName(editingStudent?.gradeSectionId || '')) {
                const existingGradeSection = gradeSections.find(gs => gs.name === newStudentGradoSec.trim());
                if (existingGradeSection) {
                    gradeSectionId = existingGradeSection.id;
                } else {
                    const newGradeSectionId = await addNewGradeSection({
                        name: newStudentGradoSec.trim(),
                        createdAt: new Date().toISOString()
                    });
                    if (newGradeSectionId) {
                        gradeSectionId = newGradeSectionId;
                    }
                }
            }

            if (editingStudent) {
                // Update existing student
                const updatedStudent: Student = {
                    ...editingStudent,
                    fullName: newStudentName.trim(),
                    gradeSectionId: gradeSectionId,
                };
                await updateExistingStudent(updatedStudent);
                setIsProcessing(false);
                closeRegisterModal();
                setToast({ message: `Estudiante ${updatedStudent.fullName} actualizado correctamente.`, type: 'success' });
            } else {
                // Create new student
                const newStudent: Student = {
                    id: uuidv4(),
                    fullName: newStudentName.trim(),
                    gradeSectionId: gradeSectionId,
                };
                await addStudent(newStudent);
                setIsProcessing(false);
                closeRegisterModal();
                setToast({ message: `Estudiante ${newStudent.fullName} registrado correctamente.`, type: 'success' });
            }

            // Reload data
            await loadAllStudents();
        } catch (error) {
            console.error('Error al procesar estudiante:', error);
            setToast({ message: 'Error al procesar estudiante: ' + error, type: 'error' });
            setIsProcessing(false);
        }
    };

    const closeRegisterModal = () => {
        setIsRegisterModalOpen(false);
        setEditingStudent(null);
        setNewStudentName('');
        setNewStudentGradoSec('');
        setRegisterErrors({});
        setIsProcessing(false);
    };


    return (
        <div className="min-h-full space-y-6 px-2 pb-4 sm:px-6 lg:px-8">
            {/* Header y Resumen */}
            <div className="pt-1 pb-2 border-b border-neutral-200 dark:border-neutral-700 sm:border-none">
                <div className="flex justify-between">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-secondary-100 dark:bg-secondary-800/50 p-3 rounded-xl">
                            <Users className="h-7 w-7 text-secondary-600 dark:text-secondary-300" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-dark-text-primary">
                                Estudiantes
                            </h2>
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
                                {students.length} estudiante{students.length !== 1 ? 's' : ''} registrado{students.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="">
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            variant="accent"
                            className="p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl focus:outline-none z-40"
                            aria-label="Importar estudiantes"
                        >
                            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                    </div>
                </div>

                {/* Barra de búsqueda */}
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring focus:ring-primary-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-dark-bg-card text-neutral-800 dark:text-dark-text-primary placeholder-neutral-400 dark:placeholder-neutral-500"
                    />
                </div>

                {/* Botones de filtro por gradoSec */}
                {uniqueGradeSections.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {uniqueGradeSections.map((gradeSection) => (
                            <button
                                key={gradeSection.id}
                                onClick={() => handleFilterByGradoSec(gradeSection.name)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedGradoSec === gradeSection.name
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                    }`}
                            >
                                {gradeSection.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lista de estudiantes */}
            <div className="mb-4">
                {students.length === 0 ? (
                    // No hay estudiantes en la base de datos
                    <div className="text-center py-12 px-4 bg-bg-card dark:bg-dark-bg-card rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-dark-text-primary mb-2">
                            No hay estudiantes registrados
                        </h3>
                        <p className="text-neutral-600 dark:text-dark-text-secondary mb-4">
                            Importa estudiantes desde un archivo Excel o registra uno nuevo para comenzar.
                        </p>
                        <div className="flex justify-center space-x-4 mt-4">
                            <Button
                                onClick={handleDownloadTemplate}
                                variant="info"
                                className="inline-flex items-center text-sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Plantilla
                            </Button>
                            <Button
                                onClick={() => setIsRegisterModalOpen(true)}
                                className="inline-flex items-center text-sm"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Registrar Estudiante
                            </Button>
                        </div>
                    </div>
                ) : !selectedGradoSec ? (
                    // No se ha seleccionado ningún grado/sección
                    <div className="text-center py-12 px-4 bg-bg-card dark:bg-dark-bg-card rounded-xl border border-neutral-200 dark:border-dark-border">
                        <div className="bg-primary-100 dark:bg-primary-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-primary-600 dark:text-primary-300" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-dark-text-primary mb-2">
                            Selecciona un Grado y Sección
                        </h3>
                        <p className="text-neutral-600 dark:text-dark-text-secondary mb-4">
                            Haz clic en uno de los botones de grado/sección arriba para ver la lista de estudiantes.
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            <span className="font-semibold">{uniqueGradeSections.length}</span> grados/secciones disponibles
                        </p>
                    </div>
                ) : sortedAndFilteredStudents.length === 0 ? (
                    // No hay estudiantes que coincidan con el filtro
                    <div className="text-center py-12 px-4 bg-bg-card dark:bg-dark-bg-card rounded-xl border border-neutral-200 dark:border-dark-border">
                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-dark-text-primary mb-2">
                            {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes en esta sección'}
                        </h3>
                        <p className="text-neutral-600 dark:text-dark-text-secondary mb-4">
                            {searchTerm
                                ? 'Intenta con otro término de búsqueda'
                                : (selectedGradoSec ? 'Esta sección no tiene estudiantes registrados aún.' : 'Haz clic en "Todos" o en una sección específica arriba.')
                            }
                        </p>
                    </div>
                ) : (
                    <div className="bg-bg-card dark:bg-dark-bg-card rounded-xl shadow-sm border border-neutral-200 dark:border-dark-border overflow-hidden">
                        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-dark-border">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-dark-text-primary">
                                Lista de Estudiantes
                            </h2>
                        </div>
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {sortedAndFilteredStudents.map((student: Student, index: number) => (
                                <div
                                    key={student.id}
                                    className="px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-150"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                                            <div className="bg-primary-100 dark:bg-primary-800/50 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                                                <span className="text-primary-700 dark:text-primary-300 font-semibold text-lg">
                                                    {student.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-base font-medium text-neutral-900 dark:text-dark-text-primary truncate">
                                                    {student.fullName}
                                                </h3>
                                                {student.gradeSectionId && (
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                        {getGradeSectionName(student.gradeSectionId)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                                            <div className="bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium px-2 py-1 rounded-full">
                                                #{String(index + 1).padStart(2, '0')}
                                            </div>
                                            <button
                                                onClick={() => handleEditStudent(student)}
                                                className="text-primary-500 hover:text-primary-700 p-1 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors"
                                                aria-label={`Editar estudiante ${student.fullName}`}
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStudent(student)}
                                                className="text-error-500 hover:text-error-700 p-1 rounded-full hover:bg-error-50 dark:hover:bg-error-900/50 transition-colors"
                                                aria-label={`Eliminar estudiante ${student.fullName}`}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

            </div>


            {/* Floating Action Button (FAB) para Registrar Estudiante */}
            {/* <Button
                onClick={() => setIsRegisterModalOpen(true)}
                className="fixed bottom-6 right-6 p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200 active:scale-95 z-40"
                aria-label="Registrar nuevo estudiante"
            >
                <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button> */}

            {/* Botón flotante para nueva matriz - Muy importante */}
            <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200 active:scale-95"
                aria-label="Crear nueva aula"
            >
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Floating Action Button (FAB) para Importar
            <button
                onClick={() => setIsImportModalOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent-200 active:scale-95 z-40"
                aria-label="Importar estudiantes"
            >
                <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
            </button> */}

            {/* Modal de importación */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-bg-card dark:bg-dark-bg-card rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between px-6 py-2 border-b border-neutral-100 dark:border-dark-border">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text-primary">
                                Importar Estudiantes
                            </h2>
                            <button
                                onClick={closeImportModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-lg transition-colors"
                                disabled={isProcessing}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        <div className="px-6 pt-2 pb-4 space-y-6">
                            {!selectedFile ? (
                                <>
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-dark-text-primary mb-2">
                                            Instrucciones
                                        </h3>
                                        <div className="bg-info-50 dark:bg-info-700/50 border border-info-100 dark:border-info-700 rounded-lg p-4">
                                            <ul className="text-sm text-info-800 dark:text-info-300 space-y-1 list-disc list-inside">
                                                <li>Descarga primero la plantilla Excel.</li>
                                                <li>Completa los datos de los estudiantes.</li>
                                                <li>Guarda el archivo en formato .xlsx.</li>
                                                <li>Arrastra el archivo aquí o selecciónalo.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Zona de arrastrar y soltar */}
                                    <div
                                        className={`border-2 border-dashed rounded-xl px-8 py-4 md:py-8 text-center transition-colors ${isDragOver
                                            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/50'
                                            : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                                            }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="bg-accent-100 dark:bg-accent-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <FileSpreadsheet className="h-8 w-8 text-accent-600 dark:text-accent-300" />
                                        </div>

                                        <h3 className="text-lg font-medium text-neutral-900 dark:text-dark-text-primary mb-2">
                                            Arrastra tu archivo Excel aquí
                                        </h3>
                                        <p className="text-neutral-600 dark:text-dark-text-secondary mb-4">
                                            o haz clic para seleccionar
                                        </p>

                                        <input
                                            type="file"
                                            accept=".xlsx"
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                            id="file-input"
                                        />
                                        <label
                                            htmlFor="file-input"
                                            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors font-medium text-sm"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Seleccionar archivo
                                        </label>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-900 dark:text-dark-text-primary mb-4">
                                        Archivo seleccionado
                                    </h3>

                                    <div className="bg-success-50 dark:bg-success-900/50 border border-success-200 dark:border-success-800 rounded-lg p-4 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <FileSpreadsheet className="h-8 w-8 text-success-600 dark:text-success-300" />
                                            <div>
                                                <p className="font-medium text-success-900 dark:text-success-200">{selectedFile.name}</p>
                                                <p className="text-sm text-success-700 dark:text-success-400">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {isProcessing && (
                                        <div className="bg-info-50 dark:bg-info-900/50 border border-info-200 dark:border-info-800 rounded-lg p-4 mb-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-info-600 border-t-transparent"></div>
                                                <span className="text-info-800 dark:text-info-300 text-sm">Procesando archivo...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botones del modal */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-neutral-100 dark:border-dark-border">
                                <Button
                                    type="button"
                                    onClick={closeImportModal}
                                    variant="neutral"
                                    className="w-full sm:flex-1 text-sm"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </Button>
                                {selectedFile && (
                                    <Button
                                        type="button"
                                        onClick={() => setSelectedFile(null)}
                                        variant="neutral"
                                        className="w-full sm:flex-1 text-sm"
                                        disabled={isProcessing}
                                    >
                                        Cambiar archivo
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    onClick={selectedFile ? handleImportStudents : handleDownloadTemplate}
                                    className="w-full sm:flex-1 text-sm"
                                    disabled={isProcessing}
                                >
                                    {selectedFile ? 'Importar Estudiantes' : 'Descargar Plantilla'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            <ModalAlert
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDeleteStudent}
                title="Eliminar Estudiante"
                message={`¿Estás seguro de que quieres eliminar a ${studentToDelete?.fullName || 'este estudiante'}? Esta acción no se puede deshacer.`}
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
            />

            {/* Modal para registrar nuevo estudiante */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-bg-card dark:bg-dark-bg-card rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-dark-border">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text-primary">
                                    {editingStudent ? 'Editar Estudiante' : 'Registrar Nuevo Estudiante'}
                                </h2>
                                <p className="text-sm text-neutral-600 dark:text-dark-text-secondary mt-1">
                                    {editingStudent ? 'Actualiza la información del estudiante.' : 'Ingresa el nombre completo del estudiante.'}
                                </p>
                            </div>
                            <button
                                onClick={closeRegisterModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-lg transition-colors"
                                disabled={isProcessing}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        <div className="p-6 space-y-5">
                            <Inputs
                                label="Nombre Completo"
                                id="newStudentName"
                                type="text"
                                value={newStudentName}
                                onChange={(e) => {
                                    setNewStudentName(e.target.value);
                                    if (registerErrors.fullName) {
                                        setRegisterErrors(prev => ({ ...prev, fullName: '' }));
                                    }
                                }}
                                placeholder="Ej: Juan Pérez García"
                                disabled={isProcessing}
                                error={registerErrors.fullName}
                                inputClassName="focus:ring-primary-500"
                            />

                            <Inputs
                                label="Grado y Sección"
                                id="newStudentGradoSec"
                                type="text"
                                value={newStudentGradoSec}
                                onChange={(e) => {
                                    setNewStudentGradoSec(e.target.value);
                                }}
                                placeholder="Ej: 1A, 2B, 3C"
                                disabled={isProcessing}
                                inputClassName="focus:ring-primary-500"
                            />

                            {isProcessing && (
                                <div className="bg-info-50 dark:bg-info-900/50 border border-info-200 dark:border-info-800 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-info-600 border-t-transparent"></div>
                                        <span className="text-info-800 dark:text-info-300 text-sm">Registrando estudiante...</span>
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-neutral-100 dark:border-dark-border">
                                <Button
                                    type="button"
                                    onClick={closeRegisterModal}
                                    variant="neutral"
                                    className="w-full sm:flex-1 text-sm"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleRegisterStudent}
                                    className="w-full sm:flex-1 text-sm"
                                    disabled={isProcessing || !newStudentName.trim()}
                                >
                                    {editingStudent ? 'Actualizar Estudiante' : 'Registrar Estudiante'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default StudentsPage;
