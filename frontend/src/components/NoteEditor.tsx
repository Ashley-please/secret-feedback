import { useState, useEffect } from 'react';

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
}

interface NoteEditorProps {
  note: Note | null;
  content: string;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onFavorite: () => void;
  onShare: () => void;
  onDecrypt: () => void;
  isSaving: boolean;
  saveSteps: string[];
  isDecrypting: boolean;
  isDecrypted: boolean;
  decryptionSteps: string[];
}

const COLORS = [
  { name: 'Gray', value: 'gray', class: 'bg-gray-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
];

export function NoteEditor({
  note,
  content,
  onContentChange,
  onTitleChange,
  onCategoryChange,
  onTagsChange,
  onColorChange,
  onSave,
  onDelete,
  onArchive,
  onFavorite,
  onShare,
  onDecrypt,
  isSaving,
  saveSteps,
  isDecrypting,
  isDecrypted,
  decryptionSteps,
}: NoteEditorProps) {
  const [localTitle, setLocalTitle] = useState('');
  const [localCategory, setLocalCategory] = useState('');
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (note) {
      setLocalTitle(note.title);
      setLocalCategory(note.category);
      setLocalTags(note.tags);
    }
  }, [note]);

  const handleTitleBlur = () => {
    if (localTitle !== note?.title) {
      onTitleChange(localTitle);
    }
  };

  const handleCategoryBlur = () => {
    if (localCategory !== note?.category) {
      onCategoryChange(localCategory);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !localTags.includes(tag)) {
      const newTags = [...localTags, tag];
      setLocalTags(newTags);
      onTagsChange(newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = localTags.filter((tag) => tag !== tagToRemove);
    setLocalTags(newTags);
    onTagsChange(newTags);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Your Vault
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select a note or create a new one to get started
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>All notes are encrypted with Zama FHE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Save Progress Modal - Fixed position for mobile */}
      {isSaving && saveSteps.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Saving Note
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we encrypt and save your note
              </p>
            </div>
            <div className="space-y-3">
              {saveSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 text-sm">
                  <span className="text-lg">{step.split(' ')[0]}</span>
                  <span className="text-gray-700 dark:text-gray-300 flex-1">
                    {step.split(' ').slice(1).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full relative">

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={onFavorite}
            className={`p-2 rounded-lg transition-colors ${
              note.isFavorite
                ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-5 h-5" fill={note.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Change color"
            >
              <div className={`w-5 h-5 rounded-full ${COLORS.find(c => c.value === note.color)?.class || 'bg-gray-500'}`}></div>
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex space-x-1 z-20">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      onColorChange(color.value);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full ${color.class} hover:scale-110 transition-transform ${
                      note.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

          <button
            onClick={onShare}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            title="Share note"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          <button
            onClick={onArchive}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            title={note.isArchived ? 'Unarchive' : 'Archive'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Delete note"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8">
          {/* Title */}
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Untitled"
            className="w-full text-3xl md:text-4xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-600 mb-4"
          />

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <input
              type="text"
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              onBlur={handleCategoryBlur}
              placeholder="Add category..."
              className="px-3 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800 outline-none focus:ring-2 focus:ring-purple-500"
            />

            {localTags.map((tag) => (
              <div
                key={tag}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onBlur={handleAddTag}
              placeholder="Add tag..."
              className="px-3 py-1 text-sm bg-transparent text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-700 rounded-full outline-none focus:border-purple-500"
            />

            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(Number(note.updatedAt) * 1000).toLocaleString()}
            </div>
          </div>

          {/* Content */}
          {!isDecrypted && note.id >= 0 ? (
            <div className="flex flex-col items-center justify-center py-8 min-h-[300px]">
              <div className="text-center max-w-md px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Encrypted Note
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
                  This note is encrypted with Zama FHE. Click decrypt to view the content.
                </p>
                
                {isDecrypting ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left space-y-2 max-h-[200px] overflow-y-auto">
                      {decryptionSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-2 text-xs md:text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={onDecrypt}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2 mx-auto text-sm md:text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>Decrypt Note</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Start writing..."
              className="w-full min-h-[300px] md:min-h-[500px] text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none text-base md:text-lg leading-relaxed placeholder-gray-400 dark:placeholder-gray-600"
            />
          )}
        </div>
      </div>
    </div>
    </>
  );
}
