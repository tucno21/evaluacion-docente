import { create } from 'zustand';

interface HeaderState {
    headerTitle: string;
    setHeaderTitle: (title: string) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    headerTitle: 'Evaluación Docente', // Default title
    setHeaderTitle: (title) => set({ headerTitle: title }),
}));
