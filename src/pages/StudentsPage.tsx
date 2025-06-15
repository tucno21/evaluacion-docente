import React, { useState, useEffect } from 'react';
import { Users, Download, Upload, X, FileSpreadsheet, Search } from 'lucide-react';
import { generateExcelTemplate, parseExcelStudents } from '../utils/excel';
import { saveAs } from 'file-saver';
import { useAppStore } from '../store/useAppStore';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { getClassroomById, getAllClassrooms } from '../utils/indexDB';
import { useHeaderStore } from '../store/useHeaderStore';
import type { Classroom, Student } from '../types/types';
import ModalAlert from '../components/ModalAlert';
import Inputs from '../components/Inputs'; // Import Inputs component
import Select from '../components/Select'; // Import Select component
import { Trash2, PlusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const StudentsPage = () => {
    const { gradeId } = useParams<{ gradeId: string }>();
    const classroomId = gradeId;
    const navigate = useNavigate(); // Initialize useNavigate

    const { students, loadStudentsByClassroom, addManyStudents, loadClassrooms, removeStudent, addStudent } = useAppStore();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copyToClassroomId, setCopyToClassroomId] = useState<string>('');
    const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
    const [copyErrors, setCopyErrors] = useState<Record<string, string>>({});
    const { setHeaderTitle } = useHeaderStore();

    // State for delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    // State for register student modal
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadClassrooms();
        if (classroomId) {
            loadStudentsByClassroom(classroomId);
            const fetchClassroomAndClassrooms = async () => {
                const fetchedClassroom = await getClassroomById(classroomId);
                if (fetchedClassroom) {
                    setHeaderTitle(`Estudiantes - ${fetchedClassroom.name} ${fetchedClassroom.grade}° ${fetchedClassroom.section}`);
                } else {
                    setHeaderTitle('Cargando aula...');
                }
                const classrooms = await getAllClassrooms();
                setAllClassrooms(classrooms.filter(classroom => classroom.id !== classroomId));
            };
            fetchClassroomAndClassrooms();
        }
    }, [classroomId, loadStudentsByClassroom, loadClassrooms, setHeaderTitle]);

    const sortedAndFilteredStudents = students
        .filter(student =>
            `${student.fullName}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const handleDownloadTemplate = () => {
        const excelBlob = generateExcelTemplate();
        saveAs(excelBlob, 'Plantilla_Estudiantes.xlsx');
        console.log('Plantilla Excel descargada.');
    };

    const handleFileSelect = (file: File) => {
        if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            setSelectedFile(file);
        } else {
            alert('Por favor selecciona un archivo Excel válido (.xlsx)');
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
        if (!selectedFile || !classroomId) {
            alert('No se puede importar estudiantes sin un ID de aula válido.');
            return;
        }

        setIsProcessing(true);

        try {
            const importedStudents = await parseExcelStudents(selectedFile);

            const studentsToSave = importedStudents.map(s => ({
                ...s,
                classroomId: classroomId,
            }));

            console.log('Importing students with classroomId:', classroomId);
            await addManyStudents(studentsToSave);

            setIsProcessing(false);
            closeImportModal();
            // alert(`Se importaron ${studentsToSave.length} estudiantes correctamente`); // Removed alert
            // No redirection after import, stay on the same view
        } catch (error) {
            console.error('Error al importar estudiantes:', error);
            alert('Error al importar estudiantes: ' + error);
            setIsProcessing(false);
        }
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        setSelectedFile(null);
        setIsDragOver(false);
        setIsProcessing(false);
    };

    const validateCopyForm = () => {
        const newErrors: Record<string, string> = {};
        if (!copyToClassroomId) {
            newErrors.classroomId = 'Debe seleccionar un aula de destino';
        }
        setCopyErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCopyStudents = async () => {
        if (!validateCopyForm()) return;

        setIsProcessing(true);

        try {
            const studentsToCopy: Student[] = students.map(student => ({
                ...student,
                id: uuidv4(),
                classroomId: copyToClassroomId,
            }));

            await addManyStudents(studentsToCopy);
            setIsProcessing(false);
            closeCopyModal();
            navigate(`/grade/${copyToClassroomId}/students`);
        } catch (error) {
            console.error('Error al copiar estudiantes:', error);
            alert('Error al copiar estudiantes: ' + error);
            setIsProcessing(false);
        }
    };

    const closeCopyModal = () => {
        setIsCopyModalOpen(false);
        setCopyToClassroomId('');
        setCopyErrors({});
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
            } catch (error) {
                console.error('Error al eliminar estudiante:', error);
                alert('Error al eliminar estudiante: ' + error);
            }
        }
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
    };

    // Register student functions
    const validateRegisterForm = () => {
        const newErrors: Record<string, string> = {};
        if (!newStudentName.trim()) {
            newErrors.fullName = 'El nombre del estudiante no puede estar vacío.';
        }
        setRegisterErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegisterStudent = async () => {
        if (!validateRegisterForm() || !classroomId) {
            return;
        }

        setIsProcessing(true);
        try {
            const newStudent: Student = {
                id: uuidv4(),
                fullName: newStudentName.trim(),
                classroomId: classroomId,
            };
            await addStudent(newStudent);
            setIsProcessing(false);
            closeRegisterModal();
            alert(`Estudiante ${newStudent.fullName} registrado correctamente.`);
        } catch (error) {
            console.error('Error al registrar estudiante:', error);
            alert('Error al registrar estudiante: ' + error);
            setIsProcessing(false);
        }
    };

    const closeRegisterModal = () => {
        setIsRegisterModalOpen(false);
        setNewStudentName('');
        setRegisterErrors({});
        setIsProcessing(false);
    };


    return (
        <div className="min-h-full space-y-6 px-2 pb-4 sm:px-6 lg:px-8">
            {/* Header y Resumen */}
            <div className="pt-1 pb-2 border-b border-neutral-200 sm:border-none">
                <div className="flex justify-between">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-secondary-100 p-3 rounded-xl">
                            <Users className="h-7 w-7 text-secondary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                                Estudiantes
                            </h2>
                            <p className="text-sm sm:text-base text-neutral-600">
                                {students.length} estudiante{students.length !== 1 ? 's' : ''} registrado{students.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className=" bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl focus:outline-none z-40"
                            aria-label="Importar estudiantes"
                        >
                            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                </div>

                {/* Barra de búsqueda */}
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Lista de estudiantes */}
            <div className="mb-4">
                {sortedAndFilteredStudents.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-xl border-2 border-dashed border-neutral-300">
                        <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                            {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
                        </h3>
                        <p className="text-neutral-600 mb-4">
                            {searchTerm
                                ? 'Intenta con otro término de búsqueda'
                                : 'Importa estudiantes desde un archivo Excel o registra uno nuevo para comenzar.'
                            }
                        </p>
                        <div className="flex justify-center space-x-4 mt-4">
                            <button
                                onClick={handleDownloadTemplate}
                                className="inline-flex items-center px-4 py-2 bg-info-600 hover:bg-info-700 text-white rounded-lg transition-colors duration-200 text-sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Plantilla
                            </button>
                            <button
                                onClick={() => setIsRegisterModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 text-sm"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Registrar Estudiante
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                            <h2 className="text-lg font-semibold text-neutral-900">
                                Lista de Estudiantes
                            </h2>
                        </div>
                        <div className="divide-y divide-neutral-200">
                            {sortedAndFilteredStudents.map((student: Student, index: number) => (
                                <div
                                    key={student.id}
                                    className="px-4 py-2 hover:bg-neutral-50 transition-colors duration-150"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                                            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                                                <span className="text-primary-700 font-semibold text-lg">
                                                    {student.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-base font-medium text-neutral-900 truncate">
                                                    {student.fullName}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                                            <div className="bg-neutral-100 text-neutral-700 text-xs font-medium px-2 py-1 rounded-full">
                                                #{String(index + 1).padStart(2, '0')}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteStudent(student)}
                                                className="text-error-500 hover:text-error-700 p-1 rounded-full hover:bg-error-50 transition-colors"
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

                {/* Botón para Copiar Estudiantes - Visible solo si hay estudiantes */}
                {sortedAndFilteredStudents.length > 0 && (
                    <div className="flex justify-center">
                        <div className="p-2 border-neutral-200 text-center mt-4">
                            <button
                                onClick={() => setIsCopyModalOpen(true)}
                                className="flex items-center justify-center space-x-2 bg-info-600 hover:bg-info-700 text-white px-5 py-3 rounded-xl transition-colors duration-200 text-base font-medium shadow-sm hover:shadow-md"
                            >
                                <span>Copiar Estudiantes a otra Aula</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Floating Action Button (FAB) para Registrar Estudiante */}
            <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200 active:scale-95 z-40"
                aria-label="Registrar nuevo estudiante"
            >
                <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between px-6 py-2 border-b border-neutral-100">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Importar Estudiantes
                            </h2>
                            <button
                                onClick={closeImportModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
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
                                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                            Instrucciones
                                        </h3>
                                        <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                                            <ul className="text-sm text-info-800 space-y-1 list-disc list-inside">
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
                                            ? 'border-primary-400 bg-primary-50'
                                            : 'border-neutral-300 hover:border-neutral-400'
                                            }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <FileSpreadsheet className="h-8 w-8 text-accent-600" />
                                        </div>

                                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                                            Arrastra tu archivo Excel aquí
                                        </h3>
                                        <p className="text-neutral-600 mb-4">
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
                                    <h3 className="text-lg font-medium text-neutral-900 mb-4">
                                        Archivo seleccionado
                                    </h3>

                                    <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <FileSpreadsheet className="h-8 w-8 text-success-600" />
                                            <div>
                                                <p className="font-medium text-success-900">{selectedFile.name}</p>
                                                <p className="text-sm text-success-700">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {isProcessing && (
                                        <div className="bg-info-50 border border-info-200 rounded-lg p-4 mb-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-info-600 border-t-transparent"></div>
                                                <span className="text-info-800 text-sm">Procesando archivo...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botones del modal */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={closeImportModal}
                                    className="w-full sm:flex-1 px-4 py-3 text-neutral-700 bg-neutral-200 hover:bg-neutral-200 rounded-xl transition-colors font-medium text-sm"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </button>
                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFile(null)}
                                        className="w-full sm:flex-1 px-4 py-3 text-neutral-700 bg-neutral-300 hover:bg-neutral-200 rounded-xl transition-colors font-medium text-sm"
                                        disabled={isProcessing}
                                    >
                                        Cambiar archivo
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={selectedFile ? handleImportStudents : handleDownloadTemplate}
                                    className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    disabled={isProcessing}
                                >
                                    {selectedFile ? 'Importar Estudiantes' : 'Descargar Plantilla'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para copiar estudiantes */}
            {isCopyModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">
                                    Copiar Estudiantes a Otra Aula
                                </h2>
                                <p className="text-sm text-neutral-600 mt-1">
                                    Selecciona el aula de destino para copiar todos los estudiantes.
                                </p>
                            </div>
                            <button
                                onClick={closeCopyModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
                                aria-label="Cerrar modal de copiar"
                                disabled={isProcessing}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Formulario de copiar */}
                        <div className="p-6 space-y-5">
                            {/* Seleccionar Aula */}
                            <Select
                                label="Seleccionar Aula de Destino"
                                id="copyToClassroom"
                                value={copyToClassroomId}
                                onChange={(e) => {
                                    setCopyToClassroomId(e.target.value);
                                    if (copyErrors.classroomId) {
                                        setCopyErrors(prev => ({ ...prev, classroomId: '' }));
                                    }
                                }}
                                error={copyErrors.classroomId}
                                options={[
                                    { value: '', label: '-- Selecciona un aula --' },
                                    ...allClassrooms.map(classroom => ({
                                        value: classroom.id,
                                        label: `${classroom.name} - ${classroom.grade}° ${classroom.section}`
                                    }))
                                ]}
                                disabled={isProcessing}
                                selectClassName="focus:ring-primary-500"
                            />

                            {isProcessing && (
                                <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-info-600 border-t-transparent"></div>
                                        <span className="text-info-800 text-sm">Copiando estudiantes...</span>
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={closeCopyModal}
                                    className="w-full sm:flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors font-medium text-sm"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopyStudents}
                                    className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    disabled={isProcessing || !copyToClassroomId}
                                >
                                    Copiar Estudiantes
                                </button>
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">
                                    Registrar Nuevo Estudiante
                                </h2>
                                <p className="text-sm text-neutral-600 mt-1">
                                    Ingresa el nombre completo del estudiante.
                                </p>
                            </div>
                            <button
                                onClick={closeRegisterModal}
                                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
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

                            {isProcessing && (
                                <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-info-600 border-t-transparent"></div>
                                        <span className="text-info-800 text-sm">Registrando estudiante...</span>
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={closeRegisterModal}
                                    className="w-full sm:flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors font-medium text-sm"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegisterStudent}
                                    className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    disabled={isProcessing || !newStudentName.trim()}
                                >
                                    Registrar Estudiante
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;
