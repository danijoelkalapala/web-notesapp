import React, { useState } from "react";
import { Plus, Search, Trash2, User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NoteList = ({
  notes,
  searchQuery,
  setSearchQuery,
  isLoading,
  onEdit,
  onCreate,
  onDelete,
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredNotes = notes.filter(
    (n) =>
      (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const MEDIA_TAG_REGEX = /\[MEDIA:(image|audio|video):([^\]]+)\]/g;

  const getDisplayContent = (content) => {
    if (!content) return "";
    return (
      content
        .replace(
          MEDIA_TAG_REGEX,
          (match, type) =>
            `[${type.charAt(0).toUpperCase() + type.slice(1)} Attachment]`
        )
        .substring(0, 150) + (content.length > 150 ? "..." : "")
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <img src="/GAH notemaker.svg" alt="App Logo" className="w-10 h-10" />
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              GAH Notemaker
            </h1>
          </div>
          <div className="ml-auto sm:hidden relative">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm overflow-hidden border border-gray-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden py-1">
                <div className="flex items-center px-4 py-2 text-sm text-gray-700 pointer-events-none border-b border-gray-100 mb-1">
                  <span className="font-medium truncate">User: {user?.name || "User"}</span>
                </div>
                <button
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => navigate('/profile')}
                >
                  <Settings size={16} className="mr-2" />
                  <span className="font-medium">Profile Settings</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} className="mr-2" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center w-full sm:w-auto gap-4">
          <div className="relative w-full sm:w-80 group order-2 sm:order-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-500 transition-all duration-200 text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="hidden sm:block order-1 sm:order-2 relative">
            <button
              className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm overflow-hidden border border-gray-200 ${isMenuOpen ? "ring-2 ring-gray-400" : ""
                }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden py-1">
                <div className="flex items-center px-4 py-2 text-sm text-gray-700 pointer-events-none border-b border-gray-100 mb-1">
                  <span className="font-medium truncate">User: {user?.name || "User"}</span>
                </div>
                <button
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => navigate('/profile')}
                >
                  <Settings size={16} className="mr-2" />
                  <span className="font-medium">Profile Settings</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} className="mr-2" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-gray-900 border-gray-200 mb-4"></div>
          <p className="text-gray-500 text-lg">Loading notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Plus size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">
            {searchQuery
              ? `No notes matched: "${searchQuery}"`
              : "No notes found. Create one!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onEdit(note)}
              className="group relative p-5 rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer bg-white hover:-translate-y-0.5 overflow-hidden flex flex-col h-full min-h-[160px]"
            >
              <div className="flex justify-between items-start mb-2">
                <h3
                  className={`font-semibold text-lg text-gray-800 line-clamp-1 ${!note.title ? "text-gray-400 italic" : ""
                    }`}
                >
                  {note.title || "Untitled Note"}
                </h3>
              </div>

              <p className="text-gray-600 text-sm line-clamp-4 flex-grow mb-4 whitespace-pre-wrap">
                {getDisplayContent(note.content) || "No content..."}
              </p>

              <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-50">
                <span className="text-xs text-gray-400 font-medium">
                  {formatDate(note.updatedAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note.id);
                  }}
                  className="p-2 -mr-2 -mb-2 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onCreate}
        className="fixed bottom-8 right-8 bg-gray-900 hover:bg-gray-800 text-white rounded-full p-4 shadow-xl shadow-gray-900/30 hover:scale-105 transition-all duration-300 active:scale-95 z-20 focus:outline-none focus:ring-4 focus:ring-gray-500/50"
        title="Create New Note"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default NoteList;
