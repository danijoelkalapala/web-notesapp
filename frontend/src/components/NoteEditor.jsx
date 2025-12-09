import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Trash2, Image, Mic, Video } from "lucide-react";

const NoteEditor = ({ note, onSave, onCancel, onDelete }) => {
  const [title, setTitle] = useState(note?.title || "");
  const contentRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const MEDIA_TAG_REGEX = /\[MEDIA:(image|audio|video):([^\]]+)\]/g;

  useEffect(() => {
    if (contentRef.current) {
      const rawContent = note?.content || "";
      const htmlContent = rawContent
        .replace(MEDIA_TAG_REGEX, (match, type, url) => {
          return createMediaHtml(type, url, match);
        })
        .replace(/\n/g, "<br>");

      contentRef.current.innerHTML = htmlContent;
    }
  }, []);

  const createMediaHtml = (type, url, rawTag, meta = {}) => {
    let element = "";
    const isBlob = url && url.startsWith && url.startsWith('blob:');
    if (isBlob) {
      // Blob URLs are ephemeral and won't be available after reload — show placeholder
      element = `
        <div class="w-full text-center text-sm text-gray-600 py-8">
          <div class="mb-2">Media unavailable after reload</div>
          <div class="text-xs text-gray-400">Please re-upload this ${type} to persist it.</div>
        </div>
      `;
    } else if (type === "image") {
      element = `<img src="${url}" class="max-w-full h-auto rounded-lg shadow-sm" alt="Note attachment" />`;
    } else if (type === "audio") {
      element = `<audio controls class="w-full"><source src="${url}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
    } else if (type === "video") {
      element = `<video controls class="w-full rounded-lg shadow-sm"><source src="${url}" type="video/mp4">Your browser does not support the video element.</video>`;
    }

    // include data attributes with url/public_id/resource_type for easier extraction when saving
    const safeUrl = (url || '').replace(/"/g, '&quot;');
    const safePublicId = (meta.public_id || '').replace(/"/g, '&quot;');
    const safeResource = (meta.resource_type || '').replace(/"/g, '&quot;');

    return `
        <div class="media-block relative group bg-gray-100 p-2 sm:p-4 rounded-xl my-4 flex justify-center w-full" contenteditable="false">
            ${element}
            <button class="delete-media-btn absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700" title="Remove Media">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
        <span class="hidden-media-tag" style="display:none" data-raw-tag="${rawTag.replace(/"/g, "&quot;")}" data-url="${safeUrl}" data-public-id="${safePublicId}" data-resource-type="${safeResource}"></span>
        </div>
      `;
  };

  const handleContentClick = (e) => {
    const btn = e.target.closest(".delete-media-btn");
    if (btn) {
      const mediaBlock = btn.closest(".media-block");
      if (mediaBlock) {
        mediaBlock.remove();
      }
    }
  };

  const handleSaveClick = () => {
    setIsSaving(true);
    let content = "";
    const unavailableMedia = [];
    const attachments = [];

    if (contentRef.current) {
      contentRef.current.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          // Text Node
          content += node.textContent;
        } else if (node.nodeType === 1) {
          // Element Node
          if (node.classList.contains("media-block")) {
            const hiddenTag = node.querySelector(".hidden-media-tag");
            if (hiddenTag) {
              const raw = hiddenTag.getAttribute("data-raw-tag") || "";
              const url = hiddenTag.getAttribute('data-url') || '';
              const public_id = hiddenTag.getAttribute('data-public-id') || '';
              const resource_type = hiddenTag.getAttribute('data-resource-type') || '';
              // detect blob: URLs which are not persistent
              if (raw.includes('blob:') || url.startsWith('blob:')) {
                unavailableMedia.push(raw || url);
              }
              // collect attachment metadata when available
              if (url) {
                attachments.push({ url, public_id, resource_type });
              }
              content += "\n\n" + raw + "\n\n";
            }
          } else if (node.tagName === "BR") {
            content += "\n";
          } else if (node.tagName === "DIV" || node.tagName === "P") {
            content += "\n" + node.innerText;
          } else {
            content += node.innerText;
          }
        }
      });
    }

    content = content.trim().replace(/\n\n\n+/g, "\n\n");

    if (unavailableMedia.length > 0) {
      const proceed = window.confirm(
        `This note contains ${unavailableMedia.length} media item(s) that are stored as temporary blob URLs and will not be available after saving.\n\nPress OK to save the note without these media items, or Cancel to re-upload them now.`
      );
      if (!proceed) {
        setIsSaving(false);
        return; // abort save so user can re-upload
      }
      // remove blob tags from content before saving
      unavailableMedia.forEach((rawTag) => {
        content = content.split(rawTag).join('');
      });
      content = content.trim().replace(/\n\n\n+/g, "\n\n");
    }

    onSave({
      ...note,
      title,
      content,
      attachments,
    });
  };

  const insertMedia = (type, url, meta = {}) => {
    // build tag with optional public_id and resource_type: [MEDIA:type:url|public_id|resource_type]
    let tag = `[MEDIA:${type}:${url}`;
    if (meta.public_id) tag += `|${meta.public_id}`;
    if (meta.resource_type) tag += `|${meta.resource_type}`;
    tag += `]`;
    const html = createMediaHtml(type, url, tag, meta);

    if (contentRef.current) {
      contentRef.current.focus();
      const success = document.execCommand("insertHTML", false, html);
      if (!success) {
        contentRef.current.innerHTML += html;
      }
    }
  };

  const handleFileSelect = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const API_BASE_URL = "http://localhost:5000";
      const form = new FormData();
      form.append("file", file);
      const token = sessionStorage.getItem("quick-notes-token");
      const res = await fetch(`${API_BASE_URL}/api/notes/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      if (data.url) {
        insertMedia(type, data.url);
      } else {
        throw new Error("No file URL returned from server");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload media. See console for details.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Note"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 active:scale-95 disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Done"}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <input
          type="text"
          placeholder="Title"
          className="w-full text-4xl font-extrabold text-gray-900 placeholder-gray-300 border-none focus:ring-0 bg-transparent p-0 mb-6"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full min-h-[50vh] text-lg text-gray-700 leading-relaxed focus:outline-none empty:before:content-[attr(placeholder)] empty:before:text-gray-400"
          placeholder="Start typing..."
          onClick={handleContentClick}
        />
      </div>

      {/* Media Bar */}
      <div className="border-t border-gray-100 bg-gray-50/80 backdrop-blur p-3 flex justify-around sm:justify-center sm:gap-8">
        <label className="cursor-pointer p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 flex flex-col items-center gap-1">
          <Image size={24} />
          <span className="text-xs font-medium">Image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect("image", e)}
          />
        </label>
        <label className="cursor-pointer p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 flex flex-col items-center gap-1">
          <Mic size={24} />
          <span className="text-xs font-medium">Audio</span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileSelect("audio", e)}
          />
        </label>
        <label className="cursor-pointer p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 flex flex-col items-center gap-1">
          <Video size={24} />
          <span className="text-xs font-medium">Video</span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect("video", e)}
          />
        </label>
      </div>
    </div>
  );
};

export default NoteEditor;
