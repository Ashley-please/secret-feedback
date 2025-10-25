import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: number;
  title: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  chunkCount: number;
  isArchived: boolean;
  isFavorite: boolean;
  color: string;
  owner?: string; // For shared notes
}

interface NotesListProps {
  notes: Note[];
  selectedNoteId: number | null;
  onNoteSelect: (noteId: number) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NotesList({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  searchQuery,
  onSearchChange,
}: NotesListProps) {
  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      red: 'border-l-red-500',
      orange: 'border-l-orange-500',
      yellow: 'border-l-yellow-500',
      green: 'border-l-green-500',
      blue: 'border-l-blue-500',
      purple: 'border-l-purple-500',
      pink: 'border-l-pink-500',
      gray: 'border-l-gray-500',
    };
    return colors[color] || 'border-l-gray-300';
  };

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query) ||
      note.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    // Favorites first
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    // Then by updated time (convert BigInt to Number)
    return Number(b.updatedAt) - Number(a.updatedAt);
  });

  return (
    <div className="w-80 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
          <button
            onClick={onNewNote}
            className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
            title="New Note"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewNote}
                className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedNotes.map((note) => (
              <button
                key={note.owner ? `${note.owner}-${note.id}` : note.id}
                onClick={() => onNoteSelect(note.id)}
                className={`w-full text-left p-3 rounded-lg border-l-4 transition-all ${
                  selectedNoteId === note.id
                    ? 'bg-white dark:bg-gray-800 shadow-sm ' + getColorClass(note.color)
                    : 'bg-transparent hover:bg-white dark:hover:bg-gray-800/50 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1">
                    {note.title}
                  </h3>
                  {note.isFavorite && (
                    <span className="text-yellow-500 ml-2 flex-shrink-0">⭐</span>
                  )}
                </div>
                
                {note.category && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                      {note.category}
                    </span>
                  </div>
                )}

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-gray-600 dark:text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {formatDistanceToNow(Number(note.updatedAt) * 1000, { addSuffix: true })}
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>{Number(note.chunkCount)} chunks</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
