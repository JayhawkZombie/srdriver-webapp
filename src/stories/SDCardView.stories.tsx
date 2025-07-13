import React, { useState, useContext } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { 
  Card, 
  Elevation, 
  Button, 
  ButtonGroup, 
  Text,
  H5,
  H6
} from '@blueprintjs/core';
import { 
  Plus, 
  Refresh, 
  Upload
} from '@blueprintjs/icons';
import { UnifiedThemeProvider } from '../context/UnifiedThemeProvider';
import { UnifiedThemeContext } from '../context/UnifiedThemeContext';
import { SDCardTree, type FileNode } from '../components/SDCardTree';

// Sample JSON response from the embedded device
const sampleJsonResponse: FileNode = {
  name: "/",
  type: "directory",
  children: [
    { name: "config.json", type: "file", size: 1024 },
    { name: "logs", type: "directory", children: [
      { name: "2024-06-01.log", type: "file", size: 4096 },
      { name: "2024-06-02.log", type: "file", size: 2048 }
    ] },
    { name: "data.csv", type: "file", size: 2048 },
    { name: "README.md", type: "file", size: 512 },
    { name: "images", type: "directory", children: [
      { name: "photo1.jpg", type: "file", size: 123456 },
      { name: "photo2.jpg", type: "file", size: 654321 }
    ] },
    { name: "backup.zip", type: "file", size: 1048576 }
  ]
};

// Error response example
const errorResponse: FileNode = {
  "name": "/nonexistent",
  "type": "directory",
  "error": "Failed to open directory"
};

const FileViewer: React.FC<{ fileName: string | null }> = ({ fileName }) => {
  const theme = useContext(UnifiedThemeContext);
  return (
    <div className={theme?.mode === 'dark' ? 'bp5-dark' : ''} style={{ padding: 16, height: '100%' }}>
      {fileName ? (
        <Text style={{ color: 'var(--bp5-intent-primary-text)', fontWeight: 600, fontSize: 18 }}>
          Selected file: <b>{fileName}</b>
        </Text>
      ) : (
        <Text style={{ color: 'var(--bp5-text-color-muted)', fontSize: 15 }}>
          Select a file to view its contents.
        </Text>
      )}
    </div>
  );
};

const SDCardView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileTree, setFileTree] = useState<FileNode | null>(sampleJsonResponse);
  const theme = useContext(UnifiedThemeContext);

  const darkBg = 'var(--bp5-dark-gray1)';
  const darkCardBg = 'var(--bp5-dark-gray2)';
  const darkText = 'var(--bp5-text-color)';
  const darkBorder = '2px solid var(--bp5-intent-primary)';
  const darkShadow = '0 4px 24px 0 rgba(0,0,0,0.45)';
  const borderRadius = 12;

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setFileTree(sampleJsonResponse);
      setIsLoading(false);
    }, 1000);
  };

  const handleUpload = () => {
    console.log('Upload file');
  };

  const handleNewFile = () => {
    console.log('Create new file');
  };

  return (
    <div
      className={theme?.mode === 'dark' ? 'bp5-dark' : ''}
      style={{
        minHeight: '100vh',
        background: theme?.mode === 'dark' ? darkBg : undefined,
        color: theme?.mode === 'dark' ? darkText : undefined,
      }}
    >
      <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <H5 style={{ margin: 0 }}>SD Card Browser</H5>
            <ButtonGroup>
              <Button icon={<Refresh />} text="Refresh" onClick={handleRefresh} loading={isLoading} />
              <Button icon={<Upload />} text="Upload" onClick={handleUpload} />
              <Button icon={<Plus />} text="New File" onClick={handleNewFile} />
            </ButtonGroup>
          </div>
        </div>
        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
          {/* Directory Tree */}
          <Card
            elevation={Elevation.TWO}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              background: theme?.mode === 'dark' ? darkCardBg : undefined,
              color: theme?.mode === 'dark' ? darkText : undefined,
              border: theme?.mode === 'dark' ? darkBorder : undefined,
              borderRadius: theme?.mode === 'dark' ? borderRadius : undefined,
              boxShadow: theme?.mode === 'dark' ? darkShadow : undefined,
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bp5-dark-gray3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <H6
                  style={{
                    margin: 0,
                    color: theme?.mode === 'dark' ? 'var(--bp5-intent-primary)' : undefined,
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    borderBottom: theme?.mode === 'dark' ? '2px solid var(--bp5-intent-primary)' : undefined,
                    paddingBottom: 4,
                  }}
                >
                  Directory Tree
                </H6>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
              <SDCardTree 
                fileTree={fileTree} 
                onFileSelect={setSelectedFile} 
                isLoading={isLoading} 
              />
            </div>
          </Card>
          {/* File Viewer */}
          <Card
            elevation={Elevation.TWO}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              background: theme?.mode === 'dark' ? darkCardBg : undefined,
              color: theme?.mode === 'dark' ? darkText : undefined,
              border: theme?.mode === 'dark' ? darkBorder : undefined,
              borderRadius: theme?.mode === 'dark' ? borderRadius : undefined,
              boxShadow: theme?.mode === 'dark' ? darkShadow : undefined,
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bp5-dark-gray3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <H6
                  style={{
                    margin: 0,
                    color: theme?.mode === 'dark' ? 'var(--bp5-intent-primary)' : undefined,
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    borderBottom: theme?.mode === 'dark' ? '2px solid var(--bp5-intent-primary)' : undefined,
                    paddingBottom: 4,
                  }}
                >
                  File Viewer
                </H6>
              </div>
            </div>
            <div style={{ flex: 1, padding: 0, overflow: 'auto', minWidth: 0 }}>
              <FileViewer fileName={selectedFile} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Story configuration
const meta: Meta<typeof SDCardView> = {
  title: 'SD Card/SD Card Directory Tree',
  component: SDCardView,
  decorators: [
    (Story) => (
      <UnifiedThemeProvider>
        <Story />
      </UnifiedThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof SDCardView>;

export const Default: Story = { args: {} };

// Additional stories to showcase different states
export const Loading: Story = {
  args: {},
  render: () => {
    const [isLoading, setIsLoading] = useState(true);
    const [fileTree, setFileTree] = useState<FileNode | null>(null);
    
    React.useEffect(() => {
      setTimeout(() => {
        setFileTree(sampleJsonResponse);
        setIsLoading(false);
      }, 2000);
    }, []);
    
    return (
      <UnifiedThemeProvider>
        <div style={{ padding: '20px', height: '100vh' }}>
          <SDCardTree 
            fileTree={fileTree} 
            onFileSelect={(name) => console.log('Selected:', name)} 
            isLoading={isLoading} 
          />
        </div>
      </UnifiedThemeProvider>
    );
  }
};

export const Error: Story = {
  args: {},
  render: () => (
    <UnifiedThemeProvider>
      <div style={{ padding: '20px', height: '100vh' }}>
        <SDCardTree 
          fileTree={errorResponse} 
          onFileSelect={(name) => console.log('Selected:', name)} 
          isLoading={false} 
        />
      </div>
    </UnifiedThemeProvider>
  )
}; 