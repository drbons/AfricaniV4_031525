import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationData } from '@/lib/types';

interface BusinessPaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}

export default function BusinessPagination({ pagination, onPageChange }: BusinessPaginationProps) {
  const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;
  
  const handlePrevPage = () => {
    if (hasPrevPage) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Logic to show current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i !== 1 && i !== totalPages) { // Avoid duplicating first and last
        pages.push(i);
      }
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page
  }
  
  return (
    <div className="flex items-center justify-center mt-8">
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        {/* Previous Page */}
        <button
          onClick={handlePrevPage}
          disabled={!hasPrevPage}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
            hasPrevPage 
              ? 'text-gray-500 hover:bg-gray-50' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="sr-only">Previous</span>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        
        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          // Check if we need to show ellipsis
          const showEllipsisBefore = index > 0 && pageNumbers[index - 1] !== page - 1;
          const showEllipsisAfter = index < pageNumbers.length - 1 && pageNumbers[index + 1] !== page + 1;
          
          return (
            <div key={page}>
              {showEllipsisBefore && (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
              
              <button
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  currentPage === page
                    ? 'z-10 bg-green-50 border-green-500 text-green-600'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                {page}
              </button>
              
              {showEllipsisAfter && (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
            </div>
          );
        })}
        
        {/* Next Page */}
        <button
          onClick={handleNextPage}
          disabled={!hasNextPage}
          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
            hasNextPage
              ? 'text-gray-500 hover:bg-gray-50'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="sr-only">Next</span>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>
      
      {/* Page info */}
      <div className="hidden sm:flex ml-4 text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
} 