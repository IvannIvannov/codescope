import type { FileFilter, FileSort, ProjectFile } from "../types";

interface VisibleProjectFile {
  file: ProjectFile;
  originalIndex: number;
}

interface ProjectSidebarProps {
  projectFiles: ProjectFile[];
  visibleProjectFiles: VisibleProjectFile[];
  selectedProjectFile: number | null;
  fileFilter: FileFilter;
  fileSort: FileSort;

  onFileFilterChange: (filter: FileFilter) => void;

  onFileSortChange: (sort: FileSort) => void;

  onSelectProjectFile: (index: number) => void;
}

function ProjectSidebar({
  projectFiles,
  visibleProjectFiles,
  selectedProjectFile,
  fileFilter,
  fileSort,
  onFileFilterChange,
  onFileSortChange,
  onSelectProjectFile,
}: ProjectSidebarProps) {
  return (
    <aside className="project-sidebar">
      <div className="project-sidebar-header">
        <div>
          <h3>Project files</h3>

          <span className="visible-files-count">
            {visibleProjectFiles.length} / {projectFiles.length}
          </span>
        </div>
      </div>

      <div className="file-filters">
        <button
          type="button"
          className={fileFilter === "all" ? "active" : ""}
          onClick={() => onFileFilterChange("all")}
        >
          All
        </button>

        <button
          type="button"
          className={fileFilter === "issues" ? "active" : ""}
          onClick={() => onFileFilterChange("issues")}
        >
          Issues
        </button>

        <button
          type="button"
          className={fileFilter === "clean" ? "active" : ""}
          onClick={() => onFileFilterChange("clean")}
        >
          Clean
        </button>
      </div>

      <label className="sort-control">
        <span>Sort by</span>

        <select
          value={fileSort}
          onChange={(event) => onFileSortChange(event.target.value as FileSort)}
        >
          <option value="issues">Most issues</option>

          <option value="name">Name</option>
        </select>
      </label>

      <div className="project-file-list">
        {visibleProjectFiles.length === 0 ? (
          <div className="no-files">No files match this filter.</div>
        ) : (
          visibleProjectFiles.map(({ file, originalIndex }) => (
            <button
              key={`${file.path}-${originalIndex}`}
              type="button"
              className={
                selectedProjectFile === originalIndex
                  ? "project-file active"
                  : "project-file"
              }
              onClick={() => onSelectProjectFile(originalIndex)}
            >
              <div>
                <strong>{file.name}</strong>

                <small>{file.path}</small>
              </div>

              {file.report && (
                <span
                  className={
                    file.report.summary.totalIssues === 0
                      ? "file-status clean"
                      : "file-status issues-found"
                  }
                >
                  {file.report.summary.totalIssues}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export default ProjectSidebar;
