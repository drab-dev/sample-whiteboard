import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

export const MermaidRenderer: React.FC = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif'
      });
      initialized.current = true;
    }
  }, []);

  return null;
};

export const renderMermaidToSVG = async (code: string): Promise<string> => {
  try {
    const { svg } = await mermaid.render('mermaid-diagram', code);
    return svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
    throw error;
  }
};