import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnifiedThemeProvider } from '../../context/UnifiedThemeProvider';
import { SDCardTree, type FileNode } from '../SDCardTree';
import type { ChunkEnvelope } from './ChunkReassembler';
import { ChunkReassembler } from './ChunkReassembler';
import { SDCardView } from './SDCardView';

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

// Example chunked BLE data matching serial output
const chunkedData: ChunkEnvelope[] = [
  {
    t: "FILE_LIST", s: 1, n: 4, p: "{\"name\":\"/\",\"type\":\"directory\",\"children\":[{\"name\":\".Spotlight-V100\",\"type\":\"directory\"},{\"name\":\".fseventsd\",\"type\":\"di", e: false
  },
  {
    t: "FILE_LIST", s: 2, n: 4, p: "rectory\"},{\"name\":\"._.Spotlight-V100\",\"type\":\"file\",\"size\":4096},{\"name\":\"data.txt\",\"type\":\"file\",\"size\":391},{\"name\":\".", e: false
  },
  {
    t: "FILE_LIST", s: 3, n: 4, p: "_data.txt\",\"type\":\"file\",\"size\":4096},{\"name\":\"sample.txt\",\"type\":\"file\",\"size\":3},{\"name\":\"logs\",\"type\":\"directory\"},{\"", e: false
  },
  {
    t: "FILE_LIST", s: 4, n: 4, p: "name\":\"data2.txt\",\"type\":\"file\",\"size\":391}]}" , e: true
  }
];

export const ChunkedBLEReassembly: React.FC = () => {
  const [fileTree, setFileTree] = React.useState<FileNode | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [receivedChunks, setReceivedChunks] = React.useState<ChunkEnvelope[]>([]);
  const [parseError, setParseError] = React.useState<string | null>(null);

  const handleSimulateList = () => {
    setLoading(true);
    setFileTree(null);
    setReceivedChunks([]);
    setParseError(null);
    const reassembler = new ChunkReassembler();
    let chunkIdx = 0;
    function sendNextChunk() {
      if (chunkIdx < chunkedData.length) {
        setReceivedChunks(prev => [...prev, chunkedData[chunkIdx]]);
        const fullJson = reassembler.addChunk(chunkedData[chunkIdx]);
        chunkIdx++;
        if (fullJson) {
    setTimeout(() => {
            try {
              setFileTree(JSON.parse(fullJson));
            } catch (err) {
              let msg = 'Unknown error';
              if (typeof err === 'object' && err && 'message' in err) {
                msg = (err as { message: string }).message;
              } else if (typeof err === 'string') {
                msg = err;
              }
              setParseError('Failed to parse chunked JSON: ' + msg);
            }
            setLoading(false);
          }, 500);
        } else {
          setTimeout(sendNextChunk, 600);
        }
      }
    }
    sendNextChunk();
  };

  // BlueprintJS dark theme variables
  const cardStyle: React.CSSProperties = {
    border: '2px solid var(--bp5-intent-primary)',
    borderRadius: 12,
    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.45)',
    padding: 24,
    marginBottom: 24,
    minWidth: 400,
  };

  return (
    <div style={{ padding: 32, minHeight: '100vh' }}>
      <h3 style={{ color: '#fff' }}>Chunked BLE Reassembly Demo</h3>
      <button onClick={handleSimulateList} disabled={loading} style={{ marginBottom: 16, fontSize: 16 }}>
        {loading ? 'Receiving...' : 'Simulate LIST (Chunked)'}
      </button>
      <div style={{ marginBottom: 16 }}>
        {receivedChunks.length > 0 && (
          <div style={cardStyle}>
            <b>Received Chunks:</b>
            <ul style={{ color: 'var(--bp5-text-color)', fontFamily: 'monospace', fontSize: 13 }}>
              {receivedChunks.map((chunk, i) => (
                <li key={i}>
                  <span>Chunk {chunk.s}/{chunk.n}: </span>
                  <span>{chunk.p.slice(0, 60)}{chunk.p.length > 60 ? '...' : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {parseError && (
          <div style={{ color: 'var(--bp5-intent-danger)', marginTop: 12 }}>{parseError}</div>
        )}
        </div>
      <div style={cardStyle}>
        <SDCardView fileTree={fileTree} loading={loading} />
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

// Wrap the ChunkedBLE story in UnifiedThemeProvider
export const ChunkedBLE: Story = {
  render: () => (
    <UnifiedThemeProvider>
      <ChunkedBLEReassembly />
    </UnifiedThemeProvider>
  )
}; 