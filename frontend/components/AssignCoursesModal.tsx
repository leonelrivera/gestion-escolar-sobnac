'use client';

import { useState, useEffect } from 'react';

interface Course {
    id: number;
    anioCurso: number;
    division: string;
    turno: string;
    cicloLectivo: {
        anio: number;
    };
}

interface AssignCoursesModalProps {
    userId: number;
    userName: string;
    onClose: () => void;
}

export default function AssignCoursesModal({ userId, userName, onClose }: AssignCoursesModalProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [assignedCourseIds, setAssignedCourseIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetch all courses
                const coursesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Fetch current assignments for this user
                const assignmentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${userId}/assignments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (coursesRes.ok && assignmentsRes.ok) {
                    const coursesData = await coursesRes.json();
                    const assignmentsData = await assignmentsRes.json();
                    setCourses(coursesData);
                    setAssignedCourseIds(assignmentsData);
                }
            } catch (err) {
                console.error('Error fetching assignment data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const handleToggleCourse = (courseId: number) => {
        setAssignedCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${userId}/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ courseIds: assignedCourseIds })
            });
            if (res.ok) {
                onClose();
            } else {
                alert('Error al guardar asignaciones');
            }
        } catch (err) {
            console.error('Error saving assignments:', err);
            alert('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-[500px] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Asignar Cursos</h2>
                    <p className="text-sm text-gray-500 font-medium">Usuario: <span className="text-blue-600">{userName}</span></p>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {courses.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No hay cursos creados.</p>
                        ) : (
                            // Group by Year for better UI
                            [...new Set(courses.map(c => c.cicloLectivo.anio))].sort((a, b) => b - a).map(year => (
                                <div key={year} className="space-y-2">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 p-2 rounded">Ciclo {year}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {courses.filter(c => c.cicloLectivo.anio === year).map(course => (
                                            <label
                                                key={course.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${assignedCourseIds.includes(course.id)
                                                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10'
                                                        : 'bg-white border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-blue-600"
                                                    checked={assignedCourseIds.includes(course.id)}
                                                    onChange={() => handleToggleCourse(course.id)}
                                                />
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{course.anioCurso}° "{course.division}"</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{course.turno}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-all"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
