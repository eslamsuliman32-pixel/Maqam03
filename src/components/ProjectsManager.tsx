import React, { useState } from "react";
import { FolderPlus, Trash2, GripVertical, FileText, Download, Play, Plus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useProjectStore } from "../store/projectStore";
import { useRepositoryStore } from "../store/repositoryStore";

export function ProjectsManager() {
  const {
    projects,
    activeProjectId,
    createProject,
    deleteProject,
    setActiveProject,
    addTrackToProject,
    deleteTrack,
    removeBarFromTrack,
  } = useProjectStore();

  const { bars } = useRepositoryStore();

  const [newProjectName, setNewProjectName] = useState("");
  const [newTrackName, setNewTrackName] = useState("");

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName("");
    }
  };

  const handleAddTrack = () => {
    if (newTrackName.trim() && activeProjectId) {
      addTrackToProject(activeProjectId, newTrackName.trim());
      setNewTrackName("");
    }
  };

  const exportProjectToText = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    
    let text = `Project: ${project.name}\n\n`;
    project.tracks.forEach((track, i) => {
      text += `--- Track ${i + 1}: ${track.name} ---\n`;
      track.bars.forEach((barRef) => {
        const repoBar = bars.find((b) => b.id === barRef.id);
        if (repoBar) {
          text += `${repoBar.text}\n`;
        }
      });
      text += `\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, "_")}.txt`;
    link.click();
  };

  return (
    <div className="w-full h-full flex gap-6 mt-4" dir="rtl">
      {/* Sidebar: Projects List */}
      <div className="w-1/4 rounded-xl border border-border-default bg-bg-surface p-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
          <FolderPlus size={20} /> مشاريعي
        </h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="اسم المشروع الجديد..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 bg-bg-default border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-cyan-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
          />
          <button
            onClick={handleCreateProject}
            className="bg-cyan-500/10 text-cyan-400 p-2 rounded-lg hover:bg-cyan-500/20"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto mt-2">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => setActiveProject(proj.id)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                activeProjectId === proj.id
                  ? "bg-cyan-500/10 border-cyan-500/50"
                  : "bg-bg-default border-border-default hover:border-text-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} className={activeProjectId === proj.id ? "text-cyan-400" : "text-text-muted"} />
                <span className="font-semibold text-sm">{proj.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProject(proj.id);
                }}
                className="text-text-muted hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center text-text-muted text-sm mt-4">لا توجد مشاريع حتى الآن.</div>
          )}
        </div>
      </div>

      {/* Main Area: Active Project Details */}
      <div className="flex-1 rounded-xl border border-border-default bg-bg-surface p-6 flex flex-col">
        {activeProjectId ? (
          (() => {
            const activeProject = projects.find((p) => p.id === activeProjectId);
            if (!activeProject) return null;

            return (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-black text-text-primary">{activeProject.name}</h1>
                    <p className="text-text-muted text-sm mt-1">تاريخ الإنشاء: {new Date(activeProject.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => exportProjectToText(activeProject.id)}
                    className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500/20"
                  >
                    <Download size={16} /> تصدير الكلمات
                  </button>
                </div>

                {/* Tracks Area */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-6">
                  {activeProject.tracks.map((track, idx) => (
                    <div key={track.id} className="rounded-xl border border-border-default bg-bg-default p-4">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-default">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Play size={16} className="text-gold-400" /> مسار {idx + 1}: {track.name}
                        </h3>
                        <button
                          onClick={() => deleteTrack(activeProject.id, track.id)}
                          className="text-text-muted hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {track.bars.map((barRef) => {
                          const bar = bars.find((b) => b.id === barRef.id);
                          return (
                            <div key={barRef.id} className="flex items-center gap-3 bg-bg-surface p-3 rounded-lg border border-border-default group">
                              <GripVertical size={16} className="text-text-muted cursor-move" />
                              <span className="flex-1 font-medium font-arabic">{bar ? bar.text : "بار غير موجود"}</span>
                              {bar && (
                                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded">
                                  {bar.rhythmicWeight} وزن
                                </span>
                              )}
                              <button
                                onClick={() => removeBarFromTrack(activeProject.id, track.id, barRef.id)}
                                className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                        {track.bars.length === 0 && (
                          <div className="text-center text-sm text-text-muted py-4">مسار فارغ. يمكنك إضافة البارات من مستودعك.</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Track */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اسم المسار الجديد..."
                      value={newTrackName}
                      onChange={(e) => setNewTrackName(e.target.value)}
                      className="flex-1 bg-bg-default border border-border-default rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500"
                      onKeyDown={(e) => e.key === "Enter" && handleAddTrack()}
                    />
                    <button
                      onClick={handleAddTrack}
                      className="bg-cyan-500/10 text-cyan-400 px-6 py-3 rounded-xl font-bold hover:bg-cyan-500/20 whitespace-nowrap"
                    >
                      إضافة مسار
                    </button>
                  </div>
                </div>
              </>
            );
          })()
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted">
            <FolderPlus size={48} className="mb-4 opacity-20" />
            <p>اختر مشروعاً أو قم بإنشاء مشروع جديد للبدء بالتأليف.</p>
          </div>
        )}
      </div>
    </div>
  );
}
