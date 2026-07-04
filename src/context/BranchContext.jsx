/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    return localStorage.getItem('selectedBranchId') || null;
  });

  const [branches, setBranches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('branches') || '[]');
    } catch {
      return [];
    }
  });

  const currentBranchName = useMemo(() => {
    if (!selectedBranchId || branches.length === 0) {
      return '';
    }
    const branch = branches.find((b) => String(b.id || b.branchId) === String(selectedBranchId));
    return branch?.name || branch?.branchName || '';
  }, [selectedBranchId, branches]);

  const switchBranch = (branchId) => {
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
    // Reload only if necessary, or let components react to context change
    // window.location.reload(); 
  };

  return (
    <BranchContext.Provider value={{
      selectedBranchId,
      setSelectedBranchId,
      branches,
      setBranches,
      currentBranchName,
      switchBranch
    }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
