import React from 'react';

interface NotebookListProps {
  currentView: 'grid' | 'list';
  className?: string;
}

export const NotebookList: React.FC<NotebookListProps> = ({ currentView, className }) => {
  // Dummy data - users should replace this with their actual data fetching and rendering
  const notebooks = [
    { id: 1, title: 'My First Notebook', lastModified: '2 hours ago' },
    { id: 2, title: 'Research Notes', lastModified: 'Yesterday' },
    { id: 3, title: 'Project Ideas', lastModified: '3 days ago' },
  ];

  return (
    <div className={`mt-6 ${className || ''}`}>
      {notebooks.length === 0 ? (
        <p className="text-center text-gray-500">No notebooks yet. Create one to get started!</p>
      ) : (
        <div
          className={
            currentView === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{notebook.title}</h3>
              <p className="text-sm text-gray-500">Last modified: {notebook.lastModified}</p>
              {/* Add more notebook details or actions here */}
            </div>
          ))}
        </div>
      )}
      {currentView === 'list' && notebooks.length > 0 && (
         <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-600">
            This is a placeholder list view. You can expand this to show more details in a table or list format.
         </div>
      )}
       {currentView === 'grid' && notebooks.length > 0 && (
         <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-600">
            This is a placeholder grid view. You can customize the card appearance.
         </div>
      )}
    </div>
  );
};
