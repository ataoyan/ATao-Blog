import React, { useState, Children, isValidElement, useMemo, memo } from 'react';
import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { baseMarkdownComponents } from './MarkdownElements';
import Alert from './Alert';
import EChartsRenderer from './EChartsRenderer';

interface TabsProps {
  children: ReactNode;
}

// Memoized tab content component to prevent unnecessary re-renders
const TabContent = memo(({ content, markdownComponents }: { content: any, markdownComponents: any }) => {
  if (typeof content === 'string') {
    return (
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    );
  } else if (Array.isArray(content)) {
    const isAllStrings = content.every(item => typeof item === 'string');
    if (isAllStrings) {
      return (
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={markdownComponents}
        >
          {content.join('')}
        </Markdown>
      );
    } else {
      return <div>{content}</div>;
    }
  } else {
    return <div>{content}</div>;
  }
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if content actually changed
  return prevProps.content === nextProps.content && prevProps.markdownComponents === nextProps.markdownComponents;
});

const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [renderedTabs, setRenderedTabs] = useState<Set<number>>(new Set([0])); // Start with first tab rendered

  // Filter valid tab elements and extract props
  const tabs = useMemo(() => {
    return Children.toArray(children).filter((child) => {
      return isValidElement(child);
    }).map((child: any) => {
      const label = child.props?.['data-tab-label'] || 'Tab';
      let content = child.props?.children;
      
      // Try to get content from data attribute if available (encoded content)
      const dataContent = child.props?.['data-tab-content'];
      if (dataContent) {
        try {
          content = decodeURIComponent(dataContent);
        } catch (e) {
          console.error('Failed to decode tab content', e);
        }
      }
      
      return {
        label,
        content
      };
    });
  }, [children]);

  if (tabs.length === 0) return null;

  // Memoize markdown components configuration to avoid recreating on every render
  const markdownComponents = useMemo(() => ({
    ...baseMarkdownComponents,
    // Handle custom alert blocks within tabs
    div: ({ node, children, className, ...props }: any) => {
      // Check data attribute first (most reliable)
      const nodeProps = node?.properties || {};
      
      // Check for Chart block
      const chartType = nodeProps['data-chart-type'] || (props as any)?.['data-chart-type'];
      if (chartType) {
        const dataStr = nodeProps['data-chart-data'] || (props as any)?.['data-chart-data'];
        
        try {
          if (!dataStr) return null;
          const decodedData = decodeURIComponent(dataStr);
          let data;
          
          try {
             data = JSON.parse(decodedData);
          } catch (e) {
            return (
              <div className="p-4 my-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                Chart data must be valid JSON
              </div>
            );
          }

          if (chartType === 'echarts') {
             return <EChartsRenderer option={data} />;
          }
        } catch (e) {
          return null;
        }
      }

      const alertType = nodeProps['data-alert-type'] || (props as any)?.['data-alert-type'];
      
      if (alertType) {
        const validTypes = ['info', 'success', 'warning', 'error'];
        const type = validTypes.includes(alertType) ? alertType : 'info';
        const title = nodeProps['data-alert-title'] || (props as any)?.['data-alert-title'];
        return <Alert type={type as any} title={title}>{children}</Alert>;
      }
      
      // Fallback: check className
      const classStr = Array.isArray(className) ? className.join(' ') : (className || '');
      if (classStr.includes('alert-block')) {
        const typeMatch = classStr.match(/alert-(\w+)/);
        const type = typeMatch ? typeMatch[1] : 'info';
        const validTypes = ['info', 'success', 'warning', 'error'];
        const alertType = validTypes.includes(type) ? type : 'info';
        return <Alert type={alertType as any}>{children}</Alert>;
      }
      
      // Also check node properties as fallback
      if (node?.properties?.className) {
        const nodeClass = Array.isArray(node.properties.className) 
          ? node.properties.className.join(' ') 
          : node.properties.className;
        if (nodeClass.includes('alert-block')) {
          const typeMatch = nodeClass.match(/alert-(\w+)/);
          const type = typeMatch ? typeMatch[1] : 'info';
          const validTypes = ['info', 'success', 'warning', 'error'];
          const alertType = validTypes.includes(type) ? type : 'info';
          return <Alert type={alertType as any}>{children}</Alert>;
        }
      }

      // Handle video block
      const videoUrl = nodeProps['data-video-url'] || (props as any)?.['data-video-url'];
      if (videoUrl) {
        const align = nodeProps['data-video-align'] || (props as any)?.['data-video-align'] || 'center';
        const width = nodeProps['data-video-width'] || (props as any)?.['data-video-width'] || '';
        const autoplay = (nodeProps['data-video-autoplay'] === 'true') || (props as any)?.['data-video-autoplay'] === 'true';
        const controls = (nodeProps['data-video-controls'] !== 'false') && (props as any)?.['data-video-controls'] !== 'false';
        const loop = (nodeProps['data-video-loop'] === 'true') || (props as any)?.['data-video-loop'] === 'true';
        const muted = (nodeProps['data-video-muted'] === 'true') || (props as any)?.['data-video-muted'] === 'true';
        const caption = nodeProps['data-video-caption'] || (props as any)?.['data-video-caption'] || '';
        
        let alignClass = 'mx-auto';
        if (align === 'left') alignClass = 'ml-0 mr-auto';
        else if (align === 'right') alignClass = 'ml-auto mr-0';
        
        let widthStyle: React.CSSProperties = { maxWidth: '100%' };
        if (width) {
          if (width.includes('%') || width.includes('px')) widthStyle.width = width;
          else if (!isNaN(Number(width))) widthStyle.width = `${width}%`;
          else widthStyle.width = width;
        }
        
        const videoElement = (
          <video
            src={videoUrl}
            controls={controls}
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            className={`block my-8 rounded-lg shadow-lg ${alignClass}`}
            style={widthStyle}
            playsInline
          >
            您的浏览器不支持视频播放。
          </video>
        );
        
        if (caption) {
          return (
            <figure className={`my-8 ${alignClass}`} style={widthStyle}>
              {videoElement}
              <figcaption className="mt-1 text-sm text-center text-slate-600 dark:text-slate-400 italic font-serif">
                {caption}
              </figcaption>
            </figure>
          );
        }
        
        return videoElement;
      }
      
      // Default div rendering
      return <div className={className} {...props}>{children}</div>;
    },
  }), []);

  // Track which tabs have been rendered (lazy render on first visit)
  const handleTabClick = (index: number) => {
    setActiveTab(index);
    // Use requestIdleCallback for non-critical updates
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        setRenderedTabs(prev => new Set([...prev, index]));
      }, { timeout: 100 });
    } else {
      setRenderedTabs(prev => new Set([...prev, index]));
    }
  };

  return (
    <div data-tab-panel="true" className="my-6 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
      {/* Tab Headers */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabClick(index)}
            className={`
              relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
              ${activeTab === index 
                ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-transparent' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }
            `}
          >
            {tab.label}
            {activeTab === index && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content - 优化: 保留已渲染的tab在DOM中，使用CSS显示/隐藏 */}
      <div className="px-4 py-3 bg-white dark:bg-[#1e1e1e] relative">
        {tabs.map((tab, index) => {
          // Only render tabs that have been visited at least once
          if (!renderedTabs.has(index)) {
            return null;
          }
          
          return (
            <div
              key={index}
              className={`prose dark:prose-invert max-w-none [&>*:last-child]:mb-0 ${
                activeTab === index ? 'block' : 'hidden'
              }`}
              style={{
                willChange: activeTab === index ? 'contents' : 'auto',
                contentVisibility: activeTab === index ? 'auto' : 'hidden',
              }}
            >
              <TabContent 
                content={tab.content} 
                markdownComponents={markdownComponents as any}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
