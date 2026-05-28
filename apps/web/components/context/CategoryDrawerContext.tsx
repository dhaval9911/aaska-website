'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface CategoryDrawerContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CategoryDrawerContext = createContext<CategoryDrawerContextValue>({
  isOpen: false,
  setOpen: () => {},
  toggle: () => {},
});

export function CategoryDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CategoryDrawerContext.Provider
      value={{
        isOpen,
        setOpen: setIsOpen,
        toggle: () => setIsOpen((prev) => !prev),
      }}
    >
      {children}
    </CategoryDrawerContext.Provider>
  );
}

export function useCategoryDrawer(): CategoryDrawerContextValue {
  return useContext(CategoryDrawerContext);
}
