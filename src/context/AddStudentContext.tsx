import { createContext, useContext, useState, type ReactNode } from 'react';
import type { StudentDTO } from '../types/api';

interface AddStudentContextValue {
  open: boolean;
  editingStudent: StudentDTO | null;
  openDialog: (student?: StudentDTO) => void;
  closeDialog: () => void;
}

const AddStudentContext = createContext<AddStudentContextValue | undefined>(undefined);

export function AddStudentProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDTO | null>(null);

  return (
    <AddStudentContext.Provider
      value={{
        open,
        editingStudent,
        openDialog: (student) => {
          setEditingStudent(student ?? null);
          setOpen(true);
        },
        closeDialog: () => {
          setOpen(false);
          setEditingStudent(null);
        },
      }}
    >
      {children}
    </AddStudentContext.Provider>
  );
}

export function useAddStudentDialog() {
  const ctx = useContext(AddStudentContext);
  if (!ctx) throw new Error('useAddStudentDialog must be used within AddStudentProvider');
  return ctx;
}
