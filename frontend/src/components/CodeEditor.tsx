import { Editor } from '@monaco-editor/react';
import { useCallback } from 'react';
import DOMPurify from 'dompurify';

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export const CodeEditor = ({
  code,
  language = 'typescript',
  onChange,
  readOnly = false,
}: CodeEditorProps) => {
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (onChange && value) {
        // Sanitize the code before passing it to the parent
        const sanitizedCode = DOMPurify.sanitize(value);
        onChange(sanitizedCode);
      }
    },
    [onChange]
  );

  return (
    <div className="h-[500px] w-full border border-gray-200 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={code}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          readOnly,
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        theme="vs-dark"
      />
    </div>
  );
}; 