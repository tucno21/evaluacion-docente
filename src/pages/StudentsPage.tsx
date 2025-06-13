import React, { useState } from 'react';
import { Users, Download, Upload, X, FileSpreadsheet, Search } from 'lucide-react';
import { generateExcelTemplate, parseExcelStudents } from '../utils/excel';
import { saveAs } from 'file-saver';
import { useAppStore } from '../store/useAppStore'; // Import useAppStore
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import { useEffect } from 'react'; // Import useEffect
import type { Classroom } from '../types/types'; // Import Classroom type
import { getClassroomById } from '../utils/indexDB'; // Import getClassroomById

const StudentsPage = () => {
    const navigate = useNavigate();
    const { gradeId } = useParams<{ gradeId: string }>();

    const classroomId = gradeId; // Use gradeId directly as classroomId

    const { students, loadStudentsByClassroom, addManyStudents, loadClassrooms } = useAppStore();
    const [currentClassroom, setCurrentClassroom] = useState<Classroom | null>(null); // New state for classroom data

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadClassrooms(); // Load all classrooms
        if (classroomId) {
            loadStudentsByClassroom(classroomId);
            const fetchClassroom = async () => {
                const fetchedClassroom = await getClassroomById(classroomId);
                setCurrentClassroom(fetchedClassroom || null);
            };
            fetchClassroom();
        }
    }, [classroomId, loadStudentsByClassroom, loadClassrooms]);

    // Filtrar estudiantes por término de búsqueda
    const filteredStudents = students.filter(student =>
        `${student.fullName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            // Assign the classroomId to each imported student
            const studentsToSave = importedStudents.map(s => ({
                ...s,
                classroomId: classroomId,
            }));

            console.log('Importing students with classroomId:', classroomId);
            await addManyStudents(studentsToSave);

            setIsProcessing(false);
            closeImportModal();
            alert(`Se importaron ${studentsToSave.length} estudiantes correctamente`);
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

    const goBack = () => {
        navigate(`/grade/${gradeId}`);
    };

    return (
        <div className="min-h-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={goBack}
                            className="text-neutral-600 hover:text-neutral-900 transition-colors"
                        >
                            ←
                        </button>
                        <div className="bg-secondary-100 p-3 rounded-xl">
                            <Users className="h-8 w-8 text-secondary-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">
                                {currentClassroom ? `Estudiantes - ${currentClassroom.name} ${currentClassroom.grade}° ${currentClassroom.section}` : 'Cargando aula...'}
                            </h1>
                            <p className="text-neutral-600">
                                {students.length} estudiante{students.length !== 1 ? 's' : ''} registrado{students.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botones principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center justify-center space-x-3 bg-info-600 hover:bg-info-700 text-white px-6 py-4 rounded-xl transition-colors duration-200 shadow-sm"
                    >
                        <Download className="h-5 w-5" />
                        <span className="font-medium">Descargar Plantilla Excel</span>
                    </button>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center justify-center space-x-3 bg-accent-600 hover:bg-accent-700 text-white px-6 py-4 rounded-xl transition-colors duration-200 shadow-sm"
                    >
                        <Upload className="h-5 w-5" />
                        <span className="font-medium">Importar desde Excel</span>
                    </button>
                </div>

                {/* Barra de búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre o documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Lista de estudiantes */}
            <div className="mb-8">
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-neutral-300">
                        <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                            {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
                        </h3>
                        <p className="text-neutral-600 mb-4">
                            {searchTerm
                                ? 'Intenta con otro término de búsqueda'
                                : 'Importa estudiantes desde un archivo Excel para comenzar'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                            <h2 className="text-lg font-semibold text-neutral-900">
                                Lista de Estudiantes
                            </h2>
                        </div>

                        <div className="divide-y divide-neutral-200">
                            {filteredStudents.map((student, index) => (
                                <div
                                    key={student.id}
                                    className="px-6 py-4 hover:bg-neutral-50 transition-colors duration-150"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center">
                                                <span className="text-primary-700 font-semibold text-lg">
                                                    {student.fullName.charAt(0)}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-medium text-neutral-900">
                                                    {student.fullName}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="bg-neutral-100 text-neutral-700 text-xs font-medium px-2 py-1 rounded-full">
                                                #{String(index + 1).padStart(2, '0')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de importación */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-semibold text-neutral-900">
                                Importar Estudiantes desde Excel
                            </h2>
                            <button
                                onClick={closeImportModal}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                                disabled={isProcessing}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        <div className="p-6">
                            {!selectedFile ? (
                                <div>
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                                            Instrucciones
                                        </h3>
                                        <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                                            <ul className="text-sm text-info-800 space-y-1">
                                                <li>• Descarga primero la plantilla Excel</li>
                                                <li>• Completa los datos de los estudiantes</li>
                                                <li>• Guarda el archivo en formato .xlsx</li>
                                                <li>• Arrastra el archivo aquí o selecciónalo</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Zona de arrastrar y soltar */}
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragOver
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
                                            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Seleccionar archivo
                                        </label>
                                    </div>
                                </div>
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
                                                <span className="text-info-800">Procesando archivo...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex space-x-3 pt-6 border-t border-neutral-200">
                                <button
                                    type="button"
                                    onClick={closeImportModal}
                                    className="flex-1 px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </button>

                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFile(null)}
                                        className="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                                        disabled={isProcessing}
                                    >
                                        Cambiar archivo
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={selectedFile ? handleImportStudents : handleDownloadTemplate}
                                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isProcessing}
                                >
                                    {selectedFile ? 'Importar Estudiantes' : 'Descargar Plantilla'}
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
