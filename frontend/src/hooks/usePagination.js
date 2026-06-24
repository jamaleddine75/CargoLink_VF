import { useState, useCallback } from 'react';

/**
 * Custom hook to handle pagination logic
 * @param {number} initialPage - Starting page index (0-based)
 * @param {number} initialLimit - Number of items per page
 * @returns {Object} Pagination state and controls
 */
export const usePagination = (initialPage = 0, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const nextPage = useCallback(() => {
    if (page < totalPages - 1) {
      setPage((prev) => prev + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((pageNumber) => {
    if (pageNumber >= 0 && (totalPages === 0 || pageNumber < totalPages)) {
      setPage(pageNumber);
    }
  }, [totalPages]);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const updatePaginationData = useCallback((pagedResponse) => {
    if (pagedResponse) {
      setTotalItems(pagedResponse.totalElements || 0);
      setTotalPages(pagedResponse.totalPages || 0);
    }
  }, []);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    resetPage,
    updatePaginationData
  };
};

export default usePagination;