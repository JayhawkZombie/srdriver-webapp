import React, { useState, useContext } from 'react';
import { Card, Elevation, Text, H5 } from '@blueprintjs/core';
import { UnifiedThemeContext } from '../../context/UnifiedThemeContext';
import { SDCardTree } from '../SDCardTree';
import type { FileNode } from '../SDCardTree';

export type SDCardViewProps = {
  fileTree: FileNode | null;
  loading?: boolean;
  error?: string;
  onFileSelect?: (file: string) => void;
};

export const SDCardView: React.FC<SDCardViewProps> = ({ fileTree, loading = false, error, onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const theme = useContext(UnifiedThemeContext);

  // File viewer panel
  const FileViewer = () => (
    <div className={theme?.mode === 'dark' ? 'bp5-dark' : ''} style={{ padding: 16, height: '100%' }}>
      {selectedFile ? (
        <Text style={{ color: 'var(--bp5-intent-primary-text)', fontWeight: 600, fontSize: 18 }}>
          Selected file: <b>{selectedFile}</b>
        </Text>
      ) : (
        <Text style={{ color: 'var(--bp5-text-color-muted)', fontSize: 15 }}>
          Select a file to view its contents.
        </Text>
      )}
    </div>
  );

  // Handle file selection
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    onFileSelect?.(fileName);
  };

  // Layout styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 24,
    background: theme?.mode === 'dark' ? 'var(--bp5-dark-gray1)' : '#f5f8fa',
    padding: 24,
    borderRadius: 12,
    boxShadow: theme?.mode === 'dark' ? '0 4px 24px 0 rgba(0,0,0,0.45)' : '0 2px 8px 0 rgba(16,30,54,0.12)',
    minHeight: 320,
    alignItems: 'flex-start',
  };
  const treePanelStyle: React.CSSProperties = {
    minWidth: 320,
    maxWidth: 400,
    flex: 1,
    background: theme?.mode === 'dark' ? 'var(--bp5-dark-gray1)' : '#f5f8fa',
  };
  const viewerPanelStyle: React.CSSProperties = {
    minWidth: 280,
    maxWidth: 480,
    flex: 1,
    background: theme?.mode === 'dark' ? 'var(--bp5-dark-gray1)' : '#f5f8fa',
    marginLeft: 8,
    minHeight: 200,
  };

  return (
    <div style={containerStyle} className={theme?.mode === 'dark' ? 'bp5-dark' : ''}>
      <Card elevation={Elevation.TWO} style={treePanelStyle}>
        <H5 style={{ marginBottom: 12 }}>SD Card Files</H5>
        <SDCardTree
          fileTree={fileTree}
          onFileSelect={handleFileSelect}
          isLoading={loading}
        />
        {error && (
          <Text style={{ color: 'var(--bp5-intent-danger)', marginTop: 12 }}>Error: {error}</Text>
        )}
      </Card>
      <Card elevation={Elevation.ONE} style={viewerPanelStyle}>
        <H5 style={{ marginBottom: 12 }}>File Viewer</H5>
        <FileViewer />
      </Card>
    </div>
  );
}; 