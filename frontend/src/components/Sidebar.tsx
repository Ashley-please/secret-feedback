import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  stats: {
    totalNotes: number;
    activeNotes: number;
    archivedNotes: number;
    favoriteNotes: number;
  };
  sharedNotesCount: number;
  categories: string[];
  tags: string[];
  onCategorySelect: (category: string) => void;
  onTagSelect: (tag: string) => void;
}

export function Sidebar({
  activeView,
  onViewChange,
  stats,
  sharedNotesCount,
  categories,
  tags,
  onCategorySelect,
  onTagSelect,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const views = [
    { id: 'all', name: 'All Notes', icon: '📝', count: stats.activeNotes },
    { id: 'shared', name: 'Shared with Me', icon: '🤝', count: sharedNotesCount },
    { id: 'favorites', name: 'Favorites', icon: '⭐', count: stats.favoriteNotes },
    { id: 'archived', name: 'Archived', icon: '📦', count: stats.archivedNotes },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`p-2 rounded-lg transition-colors ${
              activeView === view.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={view.name}
          >
            <span className="text-xl">{view.icon}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Encrypted Note</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Main Views */}
      <div className="p-3 space-y-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
              activeView === view.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{view.icon}</span>
              <span className="font-medium text-sm">{view.name}</span>
            </div>
            {view.count > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeView === view.id
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {view.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Categories
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategorySelect(category)}
                className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="truncate">{category}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tags
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-400">#</span>
                <span className="truncate">{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Storage Info */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Storage</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {stats.totalNotes} / 1000
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(stats.totalNotes / 1000) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
