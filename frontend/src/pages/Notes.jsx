import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NoteList from "../components/NoteList";
import NoteEditor from "../components/NoteEditor";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [view, setView] = useState("list"); // 'list' or 'editor'
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = sessionStorage.getItem("quick-notes-user-id");
    const userName = sessionStorage.getItem("quick-notes-user-name");
    const auth = sessionStorage.getItem("quick-notes-auth");

    if (!auth) {
      navigate("/login");
      return;
    }

    // Set initial user from session, then fetch full profile
    setUser(userName ? { name: userName } : null);

    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem("quick-notes-token");
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchProfile();
    fetchNotes();
  }, [navigate]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("quick-notes-token");
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      const response = await fetch(`${API_BASE_URL}/api/notes`, { headers });
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      const mappedNotes = data.map((note) => ({
        ...note,
        id: note._id,
      }));
      setNotes(mappedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setActiveNote({ title: "", content: "" });
    setView("editor");
  };

  const handleEdit = (note) => {
    setActiveNote({ ...note });
    setView("editor");
  };

  const handleSave = async (noteData) => {
    const payload = {
      title: noteData.title,
      content: noteData.content,
      imageUrls: noteData.imageUrls || [],
      videoUrls: noteData.videoUrls || [],
      attachments: noteData.attachments || [],
    };

    try {
      let response;
      if (noteData.id) {
        response = await fetch(`${API_BASE_URL}/api/notes/${noteData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("quick-notes-token")}` },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("quick-notes-token")}` },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save note");
      }

      await fetchNotes();
      setView("list");
      setActiveNote(null);
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/notes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${sessionStorage.getItem("quick-notes-token")}` } });
      await fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  if (view === "editor") {
    return (
      <NoteEditor
        note={activeNote}
        onSave={handleSave}
        onCancel={() => {
          setView("list");
          setActiveNote(null);
        }}
        onDelete={
          activeNote?.id
            ? () =>
              handleDelete(activeNote.id).then(() => {
                setView("list");
                setActiveNote(null);
              })
            : null
        }
      />
    );
  }

  return (
    <NoteList
      notes={notes}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      isLoading={isLoading}
      onEdit={handleEdit}
      onCreate={handleCreateNew}
      onDelete={handleDelete}
      user={user}
      onLogout={handleLogout}
    />
  );
};

export default Notes;
