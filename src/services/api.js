import API_BASE_URL from '../config/api';
import authenticatedFetch from '../utils/authFetch';

const safeJson = async (response) => {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch (e) {
        console.warn('Failed to parse JSON:', text);
        return {};
    }
};

export const login = async (userId, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: userId, password }),
        });
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Login failed');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network Error' };
    }
};

export const fetchStudentDashboard = async (regNo) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/student/dashboard?regNo=${regNo}`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch student data');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch dashboard error:', error);
        return null;
    }
};

export const fetchHODDashboard = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/hod/dashboard`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch HOD data');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch dashboard error:', error);
        return null;
    }
};

export const fetchPrincipalDashboard = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/dashboard`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch principal dashboard');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch dashboard error:', error);
        return null;
    }
};

export const fetchAllFaculty = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/faculty/all`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch faculty list');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch faculty error:', error);
        return [];
    }
};

export const fetchTimetables = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/timetables`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch timetables');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch timetables error:', error);
        return [];
    }
};

export const fetchNotifications = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/notifications`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch notifications');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return [];
    }
};

export const fetchReports = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/reports`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch reports');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch reports error:', error);
        return [];
    }
};

export const fetchHods = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/hods`);
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to fetch HODs');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch HODs error:', error);
        return [];
    }
};

export const createHod = async (hodData) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/hod`, {
            method: 'POST',
            body: JSON.stringify(hodData),
        });
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to create HOD');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Create HOD error:', error);
        throw error;
    }
};

export const updateHod = async (id, hodData) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/hod/${id}`, {
            method: 'PUT',
            body: JSON.stringify(hodData),
        });
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to update HOD');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Update HOD error:', error);
        throw error;
    }
};

export const deleteHod = async (id) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/hod/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await safeJson(response);
            throw new Error(errorData.message || 'Failed to delete HOD');
        }
        return await safeJson(response);
    } catch (error) {
        console.error('Delete HOD error:', error);
        throw error;
    }
};

export const fetchSemesterStatus = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/semester/status`);
        return await safeJson(response);
    } catch (error) {
        console.error('Fetch semester status error:', error);
        return { status: 'ACTIVE' };
    }
};

export const updateSemesterStatus = async (status) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/semester/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Update semester status error:', error);
        throw error;
    }
};

export const resetMarks = async (semester = 'All') => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/semester/reset-marks`, {
            method: 'POST',
            body: JSON.stringify({ semester })
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Reset marks error:', error);
        throw error;
    }
};

export const resetFaculty = async (semester = 'All') => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/semester/reset-faculty`, {
            method: 'POST',
            body: JSON.stringify({ semester })
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Reset faculty error:', error);
        throw error;
    }
};

export const cleanupData = async (semester = 'All') => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/semester/cleanup-data`, {
            method: 'POST',
            body: JSON.stringify({ semester })
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Cleanup data error:', error);
        throw error;
    }
};

export const shiftSemesters = async (semester = 'All', fromSemester = null, toSemester = null, deleteGraduating = false) => {
    try {
        const payload = { semester, deleteGraduating };
        if (fromSemester) payload.fromSemester = fromSemester;
        if (toSemester) payload.toSemester = toSemester;
        
        const response = await authenticatedFetch(`${API_BASE_URL}/principal/semester/shift`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Shift semesters error:', error);
        throw error;
    }
};
