import { useState, useRef, useEffect } from 'react';
import { Download, Trash2, FileText, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Tabs.css';

function FilesTab({ project, isUploading }) {
  const filesListRef = useRef(null);
  const { user } = useAuth();
  const [files, setFiles] = useState([]);

  // Load files from localStorage and update in real-time
  useEffect(() => {
    const loadFiles = () => {
      const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      
      // Filter files for the current project
      let projectFiles = storedFiles;
      if (project && project.id) {
        projectFiles = storedFiles.filter(file => file.projectId === project.id);
      }
      
      setFiles(projectFiles);
    };

    // Load files initially
    loadFiles();

    // Set up interval to check for updates
    const interval = setInterval(loadFiles, 500);

    // Listen for storage changes
    const handleStorageChange = () => {
      loadFiles();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [project]); // Re-run when project changes

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon completed" />;
      case 'uploading':
        return <Upload size={16} className="status-icon uploading" />;
      case 'error':
        return <AlertCircle size={16} className="status-icon error" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Upload Complete';
      case 'uploading':
        return 'Uploading...';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Pending';
    }
  };

  const isRecentUpload = (dateString) => {
    const uploadDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - uploadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  };

  const handleDeleteFile = (fileId, fileName) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      // Remove file from localStorage
      const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const updatedFiles = storedFiles.filter(f => f.id !== fileId);
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
      setFiles(updatedFiles.filter(f => !project || f.projectId === project.id));
    }
  };

  const handleDownload = (file) => {
    if (file.file && file.status === 'completed') {
      const url = URL.createObjectURL(file.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Render project-specific content
  const renderProjectFiles = () => {
    if (!project) {
      return (
        <div className="no-project-selected">
          <FileText size={48} className="empty-icon" />
          <h3>No Project Selected</h3>
          <p>Select a project from the dropdown above to view and manage project files</p>
        </div>
      );
    }

    if (files.length === 0 && !isUploading) {
      return (
        <div className="empty-files">
          <FileText size={48} className="empty-icon" />
          <h3>No files in {project.title}</h3>
          <p>Upload your first file to start collaborating on this project</p>
        </div>
      );
    }

    return (
      <>
        {files.map((file, index) => (
          <div key={file.id} className={`file-item ${index === 0 ? 'recent-upload' : ''}`}>
            <div className="file-icon">
              <FileText size={24} />
            </div>
            <div className="file-info">
              <div className="file-header">
                <h4>{file.name}</h4>
                
              </div>
              <div className="file-details">
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <span className="uploader">by {file.uploadedBy}</span>
                  <span className="upload-date">{formatDate(file.uploadedAt)}</span>
                </div>
                <div className="upload-status-info">
             
                  {file.status === 'uploading' && (
                    <div className="upload-progress">
                      <div className="upload-progress-bar" style={{ width: `${file.progress}%` }}></div>
                    </div>
                  )}
                
                </div>
              </div>
            </div>
            <button 
              className="download-btn" 
              title="Download"
              onClick={() => handleDownload(file)}
              disabled={file.status !== 'completed'}
            >
              <Download size={20} />
            </button>
            {user && file.uploadedBy === user.name && (
              <button 
                className="delete-btn" 
                title="Delete file"
                onClick={() => handleDeleteFile(file.id, file.name)}
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="files-section">
      <div ref={filesListRef} className="files-list scrollable">
        {renderProjectFiles()}
      </div>
    </div>
  );
}

export default FilesTab; 