"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getClientApiBaseUrl } from '@/lib/apiBase';

export default function SaveVehicleButton({ vehicleId }: { vehicleId: number }) {
    const [isSaved, setIsSaved] = useState(false);
    const [saveId, setSaveId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user, token } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        async function checkSavedStatus() {
            if (!user || !token) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch(`${getClientApiBaseUrl()}/api/saved-vehicles/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const savedList = await res.json();
                    const savedRecord = savedList.find((sv: { vehicle_id: number; id: number }) => sv.vehicle_id === vehicleId);
                    if (savedRecord) {
                        setIsSaved(true);
                        setSaveId(savedRecord.id);
                    }
                }
            } catch (error) {
                console.error('Error checking saved status:', error);
            } finally {
                setIsLoading(false);
            }
        }
        checkSavedStatus();
    }, [vehicleId, user, token]);

    const handleToggle = async () => {
        if (!user || !token) return;
        setIsLoading(true);
        try {
            const base = getClientApiBaseUrl();
            if (isSaved && saveId) {
                const res = await fetch(`${base}/api/saved-vehicles/${saveId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    setIsSaved(false);
                    setSaveId(null);
                    showToast('Removed from saved', 'info');
                } else {
                    showToast('Failed to remove', 'error');
                }
            } else {
                const res = await fetch(`${base}/api/saved-vehicles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ user_id: 0, vehicle_id: vehicleId }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsSaved(true);
                    setSaveId(data.id);
                    showToast('Vehicle saved! ❤️', 'success');
                } else {
                    showToast('Failed to save', 'error');
                }
            }
        } catch (error) {
            console.error('Error toggling save status:', error);
            showToast('Network error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading || !user}
            className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm border ${isSaved
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                className="w-4 h-4 mr-2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {!user ? 'Log in to save' : isSaved ? 'Saved' : 'Save Vehicle'}
        </button>
    );
}
