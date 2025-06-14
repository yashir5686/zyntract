
'use client';

import React from 'react';
import Editor, { type OnChange, type OnMount } from '@monaco-editor/react';
import { Skeleton } from '@/components/ui/skeleton';

interface MonacoEditorProps {
  language?: string;
  value?: string;
  onChange?: OnChange;
  height?: string | number;
  theme?: string;
  options?: object;
}

const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
  language = 'javascript',
  value = '',
  onChange,
  height = '500px', // Increased default height
  theme = 'vs-dark',
  options,
}) => {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // You can add editor instance or monaco instance related configurations here
    // For example, to enable specific language features or to configure the editor further
    editor.focus();
  };

  return (
    <div className="rounded-md border border-input overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        loading={<Skeleton className="w-full h-[500px]" />} // Match default height
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true, // Important for responsiveness
          wordWrap: 'on',
          padding: {
            top: 10,
            bottom: 10,
          },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          ...options,
        }}
      />
    </div>
  );
};

export default MonacoEditorComponent;
