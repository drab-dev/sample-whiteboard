import React, { useState } from 'react';
import { X, Sparkles, GitBranch, Wand2, Send } from 'lucide-react';

interface AIPanelProps {
  onGenerate: (prompt: string, type: 'diagram' | 'mermaid') => void;
  onClose: () => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ onGenerate, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [activeTab, setActiveTab] = useState<'prompt' | 'mermaid'>('prompt');
  const [loading, setLoading] = useState(false);

  const handlePromptGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      await onGenerate(prompt, 'diagram');
      setPrompt('');
    } finally {
      setLoading(false);
    }
  };

  const handleMermaidGenerate = async () => {
    if (!mermaidCode.trim()) return;
    
    setLoading(true);
    try {
      await onGenerate(mermaidCode, 'mermaid');
      setMermaidCode('');
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    "Create a flowchart showing the software development lifecycle",
    "Design an organizational chart for a tech startup",
    "Show the process of making coffee",
    "Create a mind map about renewable energy sources",
    "Design a user journey for an e-commerce app"
  ];

  const mermaidExamples = [
    {
      title: "Simple Flowchart",
      code: `flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`
    },
    {
      title: "Sequence Diagram",
      code: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great!`
    },
    {
      title: "Git Graph",
      code: `gitgraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop`
    }
  ];

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Sparkles size={20} className="mr-2 text-purple-600" />
          AI Tools
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'prompt'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wand2 size={16} className="inline mr-2" />
          AI Prompt
        </button>
        <button
          onClick={() => setActiveTab('mermaid')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'mermaid'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <GitBranch size={16} className="inline mr-2" />
          Mermaid
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'prompt' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what you want to create
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a flowchart showing the user registration process..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handlePromptGenerate}
              disabled={!prompt.trim() || loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Generate Diagram
                </>
              )}
            </button>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Example Prompts</h4>
              <div className="space-y-2">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mermaid.js Code
              </label>
              <textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                placeholder="Enter your Mermaid.js code here..."
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>

            <button
              onClick={handleMermaidGenerate}
              disabled={!mermaidCode.trim() || loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rendering...
                </div>
              ) : (
                <>
                  <GitBranch size={16} className="mr-2" />
                  Render Diagram
                </>
              )}
            </button>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Examples</h4>
              <div className="space-y-3">
                {mermaidExamples.map((example, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">{example.title}</h5>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {example.code}
                    </pre>
                    <button
                      onClick={() => setMermaidCode(example.code)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      Use this example
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Visit{' '}
                <a
                  href="https://mermaid.js.org/syntax/flowchart.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  Mermaid.js documentation
                </a>{' '}
                for more syntax examples.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};