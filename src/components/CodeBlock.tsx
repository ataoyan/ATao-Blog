import { useState, useEffect, useRef, memo } from 'react';
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';

export const CodeBlock = memo(({ language, children }: { language: string, children: React.ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const [SyntaxHighlighter, setSyntaxHighlighter] = useState<any>(null);
  const [codeStyle, setCodeStyle] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsible, setIsCollapsible] = useState(false);
  const codeContentRef = useRef<HTMLDivElement>(null);

  // Detect theme and load appropriate style
  useEffect(() => {

    const detectTheme = () => {
      if (typeof window !== 'undefined') {
        return document.documentElement.classList.contains('dark');
      }
      return false;
    };

    const loadSyntaxHighlighter = async () => {
      try {
        const { Prism } = await import('react-syntax-highlighter');
        const currentIsDark = detectTheme();
        setIsDark(currentIsDark);

        // Import language support for C# and Bash
        // These imports automatically register the languages with Prism
        try {
          await import('react-syntax-highlighter/dist/esm/languages/prism/csharp');
          await import('react-syntax-highlighter/dist/esm/languages/prism/bash');
        } catch (langError) {
          // Language imports are optional, continue if they fail
          console.warn('Some language imports failed (this is usually fine):', langError);
        }

        // Load appropriate style based on theme
        let styleModule;
        if (currentIsDark) {
          styleModule = await import('react-syntax-highlighter/dist/esm/styles/prism/one-dark');
        } else {
          styleModule = await import('react-syntax-highlighter/dist/esm/styles/prism/one-light');
        }
        const style = styleModule.default;

        if (Prism && style) {
          // Override font family in the style object
          const modifiedStyle = {
            ...style,
            'code[class*="language-"]': {
              ...style['code[class*="language-"]'],
              fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
              fontWeight: 400,
            },
            'pre[class*="language-"]': {
              ...style['pre[class*="language-"]'],
              fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
              fontWeight: 400,
            },
          };
          setSyntaxHighlighter(() => Prism);
          setCodeStyle(modifiedStyle);
        } else {
          console.error('Failed to load syntax highlighter components', {
            hasPrism: !!Prism,
            hasStyle: !!style
          });
        }
      } catch (error) {
        console.error('Failed to load syntax highlighter:', error);
      }
    };

    loadSyntaxHighlighter();

    // Listen for theme changes
    const handleThemeChange = (e: CustomEvent) => {
      const newIsDark = e.detail.isDark;
      setIsDark(newIsDark);

      // Reload style when theme changes
      const loadStyle = async () => {
        try {
          let styleModule;
          if (newIsDark) {
            styleModule = await import('react-syntax-highlighter/dist/esm/styles/prism/one-dark');
          } else {
            styleModule = await import('react-syntax-highlighter/dist/esm/styles/prism/one-light');
          }
          const style = styleModule.default;
          if (style) {
            // Override font family in the style object
            const modifiedStyle = {
              ...style,
              'code[class*="language-"]': {
                ...style['code[class*="language-"]'],
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
                fontWeight: 400,
              },
              'pre[class*="language-"]': {
                ...style['pre[class*="language-"]'],
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
                fontWeight: 400,
              },
            };
            setCodeStyle(modifiedStyle);
          }
        } catch (error) {
          console.error('Failed to load style:', error);
        }
      };
      loadStyle();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('theme-changed', handleThemeChange as EventListener);
      return () => {
        window.removeEventListener('theme-changed', handleThemeChange as EventListener);
      };
    }
  }, []);

  // Check if code block is long enough to be collapsible
  useEffect(() => {
    if (codeContentRef.current && SyntaxHighlighter) {
      const checkHeight = () => {
        if (codeContentRef.current) {
          const height = codeContentRef.current.scrollHeight;
          // If height exceeds 400px, make it collapsible
          setIsCollapsible(height > 400);
        }
      };

      // Check after a short delay to ensure content is rendered
      const timer = setTimeout(checkHeight, 100);

      // Also check on resize
      window.addEventListener('resize', checkHeight);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkHeight);
      };
    }
  }, [SyntaxHighlighter, children]);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgColor = isDark ? 'bg-[#1e1e1e]' : 'bg-[#f8f9fa]';
  const textColor = isDark ? 'text-slate-300' : 'text-slate-800';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';

  // Fallback UI while loading or if syntax highlighter fails to load
  if (!SyntaxHighlighter || !codeStyle) {
    return (
      <div className={`relative group my-6 rounded-md overflow-hidden border ${borderColor} ${bgColor}`}>
        <button
          onClick={handleCopy}
          className={`absolute top-3 right-3 p-1.5 rounded ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80'} transition-all opacity-0 group-hover:opacity-100 z-20`}
          aria-label="Copy code"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
        <div
          className={`relative text-sm leading-relaxed p-4 ${textColor}`}
          style={{ fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace', fontWeight: 400 }}
        >
          <pre><code>{String(children).replace(/\n$/, '')}</code></pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group my-6 rounded-md overflow-hidden border ${borderColor} ${bgColor}`}>
      <button
        onClick={handleCopy}
        className={`absolute top-3 right-3 p-1.5 rounded ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80'} transition-all opacity-0 group-hover:opacity-100 z-20`}
        aria-label="Copy code"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>

        <div
        ref={codeContentRef}
        className={`relative text-sm leading-relaxed transition-all duration-300 ${isCollapsible && !isExpanded ? 'max-h-[400px]' : ''
          }`}
        style={{ 
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace', 
          fontWeight: 400,
          overflow: 'auto',
          willChange: 'scroll-position',
          contain: 'layout style paint',
          transform: 'translateZ(0)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {isCollapsible && !isExpanded && (
          <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t pointer-events-none z-10 ${isDark
              ? 'from-[#1e1e1e] to-transparent'
              : 'from-[#f8f9fa] to-transparent'
            }`}></div>
        )}

        {isCollapsible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`group/btn absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 
              flex items-center justify-center
              transition-all duration-200 ease-out
              ${isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-700'
              } 
              hover:scale-110 active:scale-95
              focus:outline-none`}
            aria-label={isExpanded ? '收起代码' : '展开代码'}
          >
            {isExpanded ? (
              <ChevronUp size={20} className="transition-transform duration-200" />
            ) : (
              <ChevronDown size={20} className="transition-transform duration-200" />
            )}
          </button>
        )}
        <SyntaxHighlighter
          language={language || 'text'}
          style={codeStyle}
          customStyle={{ 
            margin: 0, 
            padding: '1rem', 
            background: 'transparent', 
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace', 
            fontWeight: 400,
            willChange: 'auto',
            contain: 'layout style paint'
          }}
          showLineNumbers={false}
          wrapLongLines={true}
          PreTag="div"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});

