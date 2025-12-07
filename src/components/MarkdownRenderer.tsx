import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Info, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Alert from './Alert';
import EChartsRenderer from './EChartsRenderer';
import Tabs from './Tabs';
import Timeline from './Timeline';
import LinkCard from './LinkCard';
import Chat from './Chat';
import { CodeBlock } from './CodeBlock';
import { baseMarkdownComponents, headingIdMap } from './MarkdownElements';
import { extractText, slugify } from '../utils/markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reset heading ID map BEFORE rendering to ensure SSR consistency
  // This must happen synchronously during render, not in useEffect
  // This ensures server and client generate the same IDs from the same starting state
  headingIdMap.clear();
  
  // Also clear in useEffect for client-side navigation (defensive)
  useEffect(() => {
    headingIdMap.clear();
  }, [content]);

  // Parse ordered list numbers from markdown source with indentation tracking
  const parseOrderedListNumbers = useMemo(() => {
    const numbers: Array<{ number: number; indent: number }> = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockFence = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track code blocks
      const codeBlockMatch = line.match(/^(`{3,}|~{3,})/);
      if (codeBlockMatch) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockFence = codeBlockMatch[1];
        } else if (line.startsWith(codeBlockFence)) {
          inCodeBlock = false;
          codeBlockFence = '';
        }
        continue;
      }
      
      // Skip lines inside code blocks
      if (inCodeBlock) continue;
      
      // Match ordered list items: optional indentation, number followed by period and space
      const match = line.match(/^(\s*)(\d+)\.\s+/);
      if (match) {
        const indent = match[1].length; // Count spaces for indentation
        const number = parseInt(match[2], 10);
        numbers.push({ number, indent });
      }
    }
    
    return numbers;
  }, [content]);

  // Fix ordered list numbering using actual numbers from markdown based on indentation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use requestIdleCallback for better performance, fallback to setTimeout
    const scheduleUpdate = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 0);
      }
    };

    const updateListNumbers = () => {
      // Find all ol elements within the container
      const allOlElements = container.querySelectorAll('ol');
      
      // Process all ol elements
      if (allOlElements.length === 0) return;

      // Use DocumentFragment for batch DOM updates
      const fragment = document.createDocumentFragment();
      const updates: Array<{ li: HTMLLIElement; number: number }> = [];
      
      // Collect all list items in depth-first order (matching markdown order)
      const allListItems: HTMLLIElement[] = [];
      
      const collectListItems = (ol: HTMLOListElement) => {
        const listItems = Array.from(ol.children).filter(child => child.tagName === 'LI') as HTMLLIElement[];
        listItems.forEach((li) => {
          allListItems.push(li);
          // Collect nested list items recursively
          const nestedOls = Array.from(li.children).filter(child => child.tagName === 'OL') as HTMLOListElement[];
          nestedOls.forEach((nestedOl) => {
            collectListItems(nestedOl);
          });
        });
      };
      
      // Find all top-level ol elements and collect all list items depth-first
      const topLevelOls = Array.from(allOlElements).filter(ol => !ol.closest('li')) as HTMLOListElement[];
      topLevelOls.forEach((ol) => {
        collectListItems(ol);
      });
      
      // Batch prepare all updates
      allListItems.forEach((li, index) => {
        // Use the actual number from markdown if available, otherwise use sequential numbering
        const actualNumber = index < parseOrderedListNumbers.length 
          ? parseOrderedListNumbers[index].number 
          : index + 1;
        
        updates.push({ li, number: actualNumber });
      });

      // Batch apply updates
      updates.forEach(({ li, number }) => {
        // Add class to hide ::before pseudo-element
        li.classList.add('has-list-number');
        
        // Check if there's already a number span
        let numberSpan = li.querySelector('.list-number') as HTMLSpanElement;
        if (!numberSpan) {
          // Create a span for the number
          numberSpan = document.createElement('span');
          numberSpan.className = 'list-number';
          
          // Insert before the first child
          if (li.firstChild) {
            li.insertBefore(numberSpan, li.firstChild);
          } else {
            li.appendChild(numberSpan);
          }
        }
        numberSpan.textContent = `${number}.`;
      });
    };

    scheduleUpdate(updateListNumbers);
  }, [content, parseOrderedListNumbers]);

  // Preprocess content to handle :::info, :::success, etc. syntax
  // Memoize the processing function to avoid recreating it on every render
  const processContent = useMemo(() => {
    return (text: string): string => {
    // Early return for empty content
    if (!text || text.trim().length === 0) return text;
    
    let result = text;
    
    // CRITICAL: Fix nested ordered list indentation BEFORE any other processing
    // react-markdown requires proper indentation (3+ spaces) for nested lists
    // Protect code blocks first to avoid modifying them
    const codeBlockPlaceholders: string[] = [];
    result = result.replace(/(^|\n)(`{3,}|~{3,})([\s\S]*?)\2/g, (match) => {
      const placeholder = `___CODE_BLOCK_PLACEHOLDER_${codeBlockPlaceholders.length}___`;
      codeBlockPlaceholders.push(match);
      return placeholder;
    });
    
    // Fix nested list indentation - ensure proper nesting for react-markdown
    // react-markdown requires proper indentation for nested lists
    // Standard markdown requires 3+ spaces, but we'll use 4 for reliability
    
    // Process lines and fix indentation for nested ordered lists
    // Also ensure proper line breaks for nested lists
    const lines = result.split('\n');
    const fixedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const listMatch = line.match(/^(\s*)(\d+\.\s+.*)$/);
      const prevLine = i > 0 ? lines[i - 1] : '';
      const prevListMatch = prevLine.match(/^(\s*)(\d+\.\s+.*)$/);
      
      if (listMatch) {
        const indent = listMatch[1];
        const content = listMatch[2];
        const indentLength = indent.length;
        const prevIndentLength = prevListMatch ? prevListMatch[1].length : 0;
        
        // If current line is nested (has indentation) and previous line was top-level or less indented
        // Add a blank line before nested list to ensure proper parsing
        if (indentLength > 0 && prevListMatch && prevIndentLength < indentLength) {
          // Check if there's already a blank line
          if (i > 0 && lines[i - 1].trim() !== '') {
            // Add a blank line before nested list item
            fixedLines.push('');
          }
        }
        
        // If it's a nested list item (has indentation)
        if (indentLength > 0) {
          // Ensure minimum 4 spaces for first level nesting
          if (indentLength >= 2 && indentLength <= 4) {
            fixedLines.push('    ' + content); // 4 spaces
          }
          // Ensure 7 spaces for second level nesting
          else if (indentLength >= 5 && indentLength <= 6) {
            fixedLines.push('       ' + content); // 7 spaces
          }
          // Keep deeper nesting as is (7+ spaces)
          else {
            fixedLines.push(line);
          }
        } else {
          // Top level, no change
          fixedLines.push(line);
        }
      } else {
        // Not a list item, keep as is
        fixedLines.push(line);
      }
    }
    
    result = fixedLines.join('\n');
    
    // Restore code blocks
    codeBlockPlaceholders.forEach((codeBlock, index) => {
      result = result.replace(`___CODE_BLOCK_PLACEHOLDER_${index}___`, codeBlock);
    });
    
    // Protect code blocks from being processed (for other syntax processing)
    const codeBlocks: string[] = [];
    
    // First, protect fenced code blocks (```...```)
    // Use a non-greedy match for content, but ensuring fences match
    // We capture the preceding newline (if any) in group 1 to preserve layout, but we must separate it from the code block
    result = result.replace(/(^|\n)(`{3,})([\s\S]*?)\2/g, (match, prefix, fence, content) => {
      // match is the full string including the prefix (newline)
      // We only want to store the actual code block part
      const codeBlock = match.slice(prefix.length);
      codeBlocks.push(codeBlock);
      // Return the prefix followed by the placeholder
      return `${prefix}___CODE_BLOCK_${codeBlocks.length - 1}___`;
    });
    
    // Then protect inline code (`...`)
    // Avoid matching if already protected
    result = result.replace(/(`+)([^`\n]+?)\1/g, (match) => {
       // Skip if it looks like our placeholder (though unlikely given the regex)
       if (match.includes('___CODE_BLOCK_')) return match;
       codeBlocks.push(match);
       return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
    });

    // Handle generic chart syntax: :::chart\nJSON_OPTION\n:::
    result = result.replace(/:::chart\s*\r?\n([\s\S]*?)\r?\n:::/g, (match: string, content: string) => {
      try {
        const encodedData = encodeURIComponent(content.trim());
        return `<div data-chart-type="echarts" data-chart-data="${encodedData}"></div>`;
      } catch (e) {
        return match;
      }
    });

    // Helper function to parse video attributes (reused for both formats)
    const parseVideoAttrs = (attrs: string) => {
      const widthMatch = attrs.match(/width:\s*([^,}]+)/i);
      const alignMatch = attrs.match(/align:\s*(\w+)/i);
      const autoplayMatch = attrs.match(/autoplay:\s*(\w+)/i);
      const controlsMatch = attrs.match(/controls:\s*(\w+)/i);
      const loopMatch = attrs.match(/loop:\s*(\w+)/i);
      const mutedMatch = attrs.match(/muted:\s*(\w+)/i);
      const captionMatch = attrs.match(/caption:\s*([^,}]+)/i);
      
      const width = widthMatch ? widthMatch[1].trim() : '';
      const align = alignMatch ? alignMatch[1].toLowerCase() : 'center';
      const autoplay = autoplayMatch ? autoplayMatch[1].toLowerCase() === 'true' : false;
      const controls = controlsMatch ? controlsMatch[1].toLowerCase() !== 'false' : true;
      const loop = loopMatch ? loopMatch[1].toLowerCase() === 'true' : false;
      const muted = mutedMatch ? mutedMatch[1].toLowerCase() === 'true' : false;
      let caption = '';
      const captionIndex = attrs.search(/caption:\s*/i);
      if (captionIndex !== -1) {
        const afterCaption = attrs.substring(captionIndex + 8);
        caption = afterCaption.replace(/\s*,\s*(align|width|autoplay|controls|loop|muted):.*$/i, '').trim();
      }
      
      return { width, align, autoplay, controls, loop, muted, caption };
    };

    const buildVideoAttrs = (url: string, attrs: ReturnType<typeof parseVideoAttrs>) => {
      let dataAttrs = `data-video-url="${url.replace(/"/g, '&quot;')}"`;
      dataAttrs += ` data-video-align="${attrs.align}"`;
      if (attrs.width) dataAttrs += ` data-video-width="${attrs.width}"`;
      if (attrs.autoplay) dataAttrs += ` data-video-autoplay="true"`;
      if (!attrs.controls) dataAttrs += ` data-video-controls="false"`;
      if (attrs.loop) dataAttrs += ` data-video-loop="true"`;
      if (attrs.muted) dataAttrs += ` data-video-muted="true"`;
      if (attrs.caption) dataAttrs += ` data-video-caption="${attrs.caption.replace(/"/g, '&quot;')}"`;
      return dataAttrs;
    };

    // Handle video syntax: :::video{width:80%, align:center, ...} ::: or :::video{...}视频URL:::
    // Support: width, align, autoplay, controls, loop, muted, caption
    // Format 1: :::video{attrs}\n视频URL\n:::
    // Format 2: :::video{attrs}视频URL:::
    result = result.replace(/:::video\{([^}]*)\}\r?\n([\s\S]*?)\r?\n:::/g, (match: string, attrs: string, url: string) => {
      const cleanUrl = url.trim();
      if (!cleanUrl) return match;
      
      const parsedAttrs = parseVideoAttrs(attrs);
      const dataAttrs = buildVideoAttrs(cleanUrl, parsedAttrs);
      
      return `<div ${dataAttrs} class="video-block"></div>`;
    });
    
    // Format 2: :::video{attrs}视频URL:::
    result = result.replace(/:::video\{([^}]*)\}([^\n]+?):::/g, (match: string, attrs: string, url: string) => {
      const cleanUrl = url.trim();
      if (!cleanUrl) return match;
      
      const parsedAttrs = parseVideoAttrs(attrs);
      const dataAttrs = buildVideoAttrs(cleanUrl, parsedAttrs);
      
      return `<div ${dataAttrs} class="video-block"></div>`;
    });
    
    // Handle alert syntax: :::alert{type:info, title:标题}\ncontent\n::: or :::alert{type:info, title:标题}content:::
    // Support: type (info|success|warning|error), title (optional)
    const validTypes = ['info', 'success', 'warning', 'error'];
    
    const parseAlertAttrs = (attrs: string) => {
      const typeMatch = attrs.match(/type:\s*(\w+)/i);
      const titleMatch = attrs.match(/title:\s*([^,}]+)/i);
      
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'info';
      const normalizedType = validTypes.includes(type) ? type : 'info';
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      return { normalizedType, title };
    };
    
    const buildAlertHtml = (type: string, title: string, content: string) => {
      const titleAttr = title ? ` data-alert-title="${title.replace(/"/g, '&quot;')}"` : '';
      return `\n<div data-alert-type="${type}"${titleAttr} class="alert-block alert-${type}">\n\n${content}\n\n</div>\n`;
    };
    
    // Format 1: Multi-line: :::alert{type:info, title:标题}\ncontent\n:::
    result = result.replace(/:::alert\{([^}]*)\}\r?\n([\s\S]*?)\r?\n:::/g, (match: string, attrs: string, content: string) => {
      const { normalizedType, title } = parseAlertAttrs(attrs);
      const cleanContent = content.trim();
      
      if (!cleanContent) {
        return match;
      }
      
      return buildAlertHtml(normalizedType, title, cleanContent);
    });
    
    // Format 2: Single-line: :::alert{type:info, title:标题}content:::
    result = result.replace(/:::alert\{([^}]*)\}([^\n]+?):::/g, (match: string, attrs: string, content: string) => {
      const { normalizedType, title } = parseAlertAttrs(attrs);
      const cleanContent = content.trim();
      
      if (!cleanContent) {
        return match;
      }
      
      return buildAlertHtml(normalizedType, title, cleanContent);
    });
    
    // Handle strikethrough syntax: ~~text~~ is handled by remark-gfm natively
    
    // Handle highlight syntax: ==text==
    // Convert ==text== to <mark>text</mark>
    result = result.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    
    // Handle superscript syntax: ^text^
    // Convert ^text^ to <sup>text</sup>
    result = result.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');
    
    // Handle subscript syntax: ~text~
    // Convert ~text~ to <sub>text</sub>
    result = result.replace(/(?<!~)~([^~\n]+)~(?!~)/g, '<sub>$1</sub>');
    
    // Handle image with attributes FIRST (before links) to avoid conflicts
    // Format: ![alt](url) {align:center, width:50%, caption:说明}
    // Support: align (left|center|right), width (percentage or px), caption (text)
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)\s*\{([^}]+)\}/g, (match: string, alt: string, url: string, attrs: string) => {
      // Parse attributes: align:center, width:50%, caption:说明
      // Note: caption should be parsed last as it may contain commas
      const alignMatch = attrs.match(/align:\s*(\w+)/i);
      const widthMatch = attrs.match(/width:\s*([^,}]+)/i);
      // For caption, match everything after "caption:" until the end or next attribute
      // We'll use a more sophisticated approach: find caption: and take everything after it
      let caption = '';
      const captionIndex = attrs.search(/caption:\s*/i);
      if (captionIndex !== -1) {
        const afterCaption = attrs.substring(captionIndex + 8); // "caption:".length = 8
        // Remove any trailing attributes (align: or width: that might appear after)
        caption = afterCaption.replace(/\s*,\s*(align|width):.*$/i, '').trim();
      }
      
      const align = alignMatch ? alignMatch[1].toLowerCase() : 'center';
      const width = widthMatch ? widthMatch[1].trim() : '';
      
      let dataAttrs = `data-image-align="${align}"`;
      if (width) {
        dataAttrs += ` data-image-width="${width}"`;
      }
      if (caption) {
        dataAttrs += ` data-image-caption="${caption.replace(/"/g, '&quot;')}"`;
      }
      
      return `<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" ${dataAttrs} />`;
    });
    
    // Handle links with title: [text](url "title")
    // Note: react-markdown will parse this, but we need to preserve the title
    // Format: [text](url "title") -> we'll let react-markdown parse it, then extract title from node
    // For now, we'll also handle it in preprocessing as a fallback
    // Match: [text](url "title") where title is in quotes
    result = result.replace(/\[([^\]]+)\]\(([^)]+?)\s+"([^"]+)"\)/g, (match: string, text: string, url: string, linkTitle: string) => {
      // Escape quotes in title
      const escapedTitle = linkTitle.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      return `<a href="${url}" data-link-title="${escapedTitle}">${text}</a>`;
    });
    
    // Handle icon links: [text](url) {iconName}
    // Convert to <a href="url" data-icon="iconName">text</a>
    // This must come AFTER title processing to avoid conflicts
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)\s*\{([^}]+)\}/g, '<a href="$2" data-icon="$3">$1</a>');
    
    // Handle chat syntax FIRST (before other ::: syntax to avoid conflicts)
    // Handle chat syntax: :::chat\n@person name:xxx, avatar:xxx\nmessage\n@person name:yyy\nreply\n:::
    result = result.replace(/:::chat\s*\r?\n([\s\S]*?)\r?\n:::/g, (match, content) => {
      // Encode the chat content
      const trimmedContent = content.trim();
      if (!trimmedContent) return match; // Skip empty content
      const encodedContent = encodeURIComponent(trimmedContent);
      return `<div data-chat="true" data-chat-content="${encodedContent}"></div>`;
    });
    
    // Also handle chat where closing ::: might be on same line or without preceding newline
    result = result.replace(/:::chat\s*\r?\n([\s\S]*?):::/g, (match, content) => {
      // Skip if already processed (contains data-chat attribute)
      if (match.includes('data-chat="true"')) return match;
      // Ensure content doesn't end with :::
      const cleanContent = content.replace(/:::\s*$/, '').trim();
      if (!cleanContent) return match;
      // Encode the chat content
      const encodedContent = encodeURIComponent(cleanContent);
      return `<div data-chat="true" data-chat-content="${encodedContent}"></div>`;
    });
    
    // Handle tabs syntax: :::tabs\n@tab Label 1\nContent 1\n@tab Label 2\nContent 2\n:::
    // Convert to <div data-tabs="true"><div data-tab-label="Label 1">Content 1</div>...</div>
    // Relaxed regex: Do not enforce newline before closing ::: to allow for more robust matching
    result = result.replace(/:::tabs\s*\r?\n([\s\S]*?):::/g, (match, content) => {
      // Split by @tab, but capture the label
      const parts = content.split(/@tab\s+([^\n\r]+)\r?\n/);
      // parts[0] is content before first @tab (usually empty)
      // parts[1] is label 1
      // parts[2] is content 1
      // ...
      
      let html = '<div data-tabs="true">\n';
      
      // Start from index 1 because parts[0] is empty or whitespace
      for (let i = 1; i < parts.length; i += 2) {
        const label = parts[i].trim();
        let tabContent = parts[i+1] || '';
        
        // Restore code blocks in tab content BEFORE encoding
        // This ensures that the data-tab-content attribute contains the original code blocks
        // which will be properly rendered by the inner Markdown component in Tabs.tsx
        tabContent = tabContent.replace(/___CODE_BLOCK_(\d+)___/g, (match: string, id: string) => codeBlocks[parseInt(id)]);
        
        html += `<div data-tab-label="${label.replace(/"/g, '&quot;')}" data-tab-content="${encodeURIComponent(tabContent)}"></div>\n`;
      }
      
      html += '</div>';
      return html;
    });
    
    // Handle link-card syntax: :::link-card{url:xxx, title:xxx, description:xxx, image:xxx}
    // Format: :::link-card{url:https://example.com, title:标题, description:描述, image:图片URL}
    result = result.replace(/:::link-card\{([^}]+)\}\s*\r?\n?([\s\S]*?):::/g, (match, attrs, content) => {
      // Parse attributes: url, title, description, image
      const urlMatch = attrs.match(/url:\s*['"]?([^,'"]+)['"]?/i);
      const titleMatch = attrs.match(/title:\s*['"]?([^,'"]+)['"]?/i);
      const descriptionMatch = attrs.match(/description:\s*['"]?([^,'"]+)['"]?/i);
      const imageMatch = attrs.match(/image:\s*['"]?([^,'"]+)['"]?/i);
      
      const url = urlMatch ? urlMatch[1].trim() : '';
      const title = titleMatch ? titleMatch[1].trim() : '';
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';
      const image = imageMatch ? imageMatch[1].trim() : '';
      
      if (!url) return match; // Skip if no URL
      
      // Use content as title if title is not provided
      const finalTitle = title || content.trim() || '';
      
      return `<div data-link-card="true" data-link-url="${encodeURIComponent(url)}" data-link-title="${encodeURIComponent(finalTitle)}" data-link-description="${encodeURIComponent(description)}" data-link-image="${encodeURIComponent(image)}"></div>`;
    });
    
    // Handle chat syntax: :::chat\n@person name:xxx, avatar:xxx\nmessage\n@person name:yyy\nreply\n:::
    // Match chat block - use more flexible pattern
    result = result.replace(/:::chat\s*\r?\n([\s\S]*?)\r?\n:::/g, (match, content) => {
      // Encode the chat content
      const trimmedContent = content.trim();
      if (!trimmedContent) return match; // Skip empty content
      const encodedContent = encodeURIComponent(trimmedContent);
      return `<div data-chat="true" data-chat-content="${encodedContent}"></div>`;
    });
    
    // Also handle chat where closing ::: might be on same line or without preceding newline
    result = result.replace(/:::chat\s*\r?\n([\s\S]*?):::/g, (match, content) => {
      // Skip if already processed (contains data-chat attribute)
      if (match.includes('data-chat="true"')) return match;
      // Ensure content doesn't end with :::
      const cleanContent = content.replace(/:::\s*$/, '').trim();
      if (!cleanContent) return match;
      // Encode the chat content
      const encodedContent = encodeURIComponent(cleanContent);
      return `<div data-chat="true" data-chat-content="${encodedContent}"></div>`;
    });
    
    // Handle timeline syntax: :::timeline\n@item date | title\ncontent\n@item date | title\ncontent\n:::
    // Also supports: :::timeline\n@item date\ntitle\ncontent\n:::
    result = result.replace(/:::timeline\s*\r?\n([\s\S]*?):::/g, (match, content) => {
      // Split by @item
      const parts = content.split(/@item\s+([^\n\r]+)\r?\n/);
      
      let html = '<div data-timeline="true">\n';
      
      // Start from index 1 because parts[0] is content before first @item (usually empty)
      for (let i = 1; i < parts.length; i += 2) {
        const header = parts[i].trim();
        let itemContent = parts[i+1] || '';
        
        // Parse header: "date | title" or just "date" or just "title"
        let date = '';
        let title = '';
        
        if (header.includes('|')) {
          const [datePart, titlePart] = header.split('|').map(s => s.trim());
          date = datePart || '';
          title = titlePart || '';
        } else {
          // If no |, treat the whole header as date (or title if it doesn't look like a date)
          // Simple heuristic: if it contains numbers and looks like a date, it's a date
          if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(header) || /^\d{4}/.test(header)) {
            date = header;
          } else {
            title = header;
          }
        }
        
        // Restore code blocks in item content BEFORE encoding
        itemContent = itemContent.replace(/___CODE_BLOCK_(\d+)___/g, (match: string, id: string) => codeBlocks[parseInt(id)]);
        
        html += `<div data-timeline-date="${date.replace(/"/g, '&quot;')}" data-timeline-title="${title.replace(/"/g, '&quot;')}" data-timeline-content="${encodeURIComponent(itemContent)}"></div>\n`;
      }
      
      html += '</div>';
      return html;
    });
    
    // Restore code blocks in the remaining content (outside of tabs/charts that handled it themselves)
    // Note: Charts/Videos/Alerts generated HTML usually doesn't contain our placeholders 
    // unless the user put code blocks inside them. 
    // If Alert content has placeholders, we should restore them too so they render as code.
    result = result.replace(/___CODE_BLOCK_(\d+)___/g, (match, id) => codeBlocks[parseInt(id)]);
    
      return result;
    };
  }, []);

  // Memoize processed content to avoid reprocessing on every render
  // Use a ref to cache the last processed content to avoid unnecessary reprocessing
  const processedContentRef = useRef<{ content: string; processed: string } | null>(null);
  
  const processedContent = useMemo(() => {
    // Check if content hasn't changed
    if (processedContentRef.current?.content === content) {
      return processedContentRef.current.processed;
    }
    
    const processed = processContent(content);
    processedContentRef.current = { content, processed };
    return processed;
  }, [content, processContent]);

  // Memoize components to avoid recreating on every render
  const markdownComponents = useMemo(() => ({
    ...baseMarkdownComponents,
    // Handle custom alert blocks (converted from ::: syntax)
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

                // Handle ECharts
                if (chartType === 'echarts') {
                   return <EChartsRenderer option={data} />;
                }

                // Unknown chart type
                return (
                  <div className="p-4 my-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    Unknown chart type: {chartType}
                  </div>
                );
              } catch (e) {
                return (
                  <div className="p-4 my-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    Error rendering chart
                  </div>
                );
              }
            }

            const alertType = nodeProps['data-alert-type'] || 
                             (props as any)?.['data-alert-type'];
            
            if (alertType) {
              const validTypes = ['info', 'success', 'warning', 'error'];
              const type = validTypes.includes(alertType) ? alertType : 'info';
              // Get title from data attribute
              const title = node?.properties?.['data-alert-title'] || 
                          (props as any)?.['data-alert-title'];
              // If title exists, use it; otherwise undefined (will use default or hide if empty)
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
            
            // Check if this is a video block
            const videoUrl = nodeProps['data-video-url'] || (props as any)?.['data-video-url'];
            if (videoUrl) {
              const align = (nodeProps['data-video-align'] as string) || 
                           (props as any)?.['data-video-align'] || 
                           'center';
              const width = (nodeProps['data-video-width'] as string) || 
                           (props as any)?.['data-video-width'] || 
                           '';
              const autoplay = (nodeProps['data-video-autoplay'] as string) === 'true' || 
                              (props as any)?.['data-video-autoplay'] === 'true';
              const controls = (nodeProps['data-video-controls'] as string) !== 'false' && 
                              (props as any)?.['data-video-controls'] !== 'false';
              const loop = (nodeProps['data-video-loop'] as string) === 'true' || 
                          (props as any)?.['data-video-loop'] === 'true';
              const muted = (nodeProps['data-video-muted'] as string) === 'true' || 
                           (props as any)?.['data-video-muted'] === 'true';
              const caption = (nodeProps['data-video-caption'] as string) || 
                             (props as any)?.['data-video-caption'] || 
                             '';
              
              // Determine alignment classes
              let alignClass = 'mx-auto'; // center by default
              if (align === 'left') {
                alignClass = 'ml-0 mr-auto';
              } else if (align === 'right') {
                alignClass = 'ml-auto mr-0';
              }
              
              // Parse width
              let widthStyle: React.CSSProperties = {
                maxWidth: '100%',
              };
              if (width) {
                if (width.includes('%')) {
                  widthStyle.width = width;
                } else if (width.includes('px')) {
                  widthStyle.width = width;
                } else if (!isNaN(Number(width))) {
                  widthStyle.width = `${width}%`;
                } else {
                  widthStyle.width = width;
                }
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
                  preload={autoplay ? "auto" : "metadata"}
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
            
            // Check if this is a tabs container
            const isTabs = nodeProps['data-tabs'] === 'true' || (props as any)?.['data-tabs'] === 'true';
            if (isTabs) {
              return <Tabs>{children}</Tabs>;
            }

            // Check if this is a timeline container
            const isTimeline = nodeProps['data-timeline'] === 'true' || (props as any)?.['data-timeline'] === 'true';
            if (isTimeline) {
              return <Timeline>{children}</Timeline>;
            }

            // Check if this is a chat container
            const isChat = nodeProps['data-chat'] === 'true' || (props as any)?.['data-chat'] === 'true';
            if (isChat) {
              const chatContent = nodeProps['data-chat-content'] || (props as any)?.['data-chat-content'] || '';
              
              try {
                if (chatContent) {
                  const decodedContent = decodeURIComponent(chatContent);
                  return <Chat>{decodedContent}</Chat>;
                }
                return null;
              } catch (e) {
                console.error('Failed to decode chat content:', e);
                return null;
              }
            }

            // Check if this is a link-card container
            const isLinkCard = nodeProps['data-link-card'] === 'true' || (props as any)?.['data-link-card'] === 'true';
            if (isLinkCard) {
              const url = nodeProps['data-link-url'] || (props as any)?.['data-link-url'] || '';
              const title = nodeProps['data-link-title'] || (props as any)?.['data-link-title'] || '';
              const description = nodeProps['data-link-description'] || (props as any)?.['data-link-description'] || '';
              const image = nodeProps['data-link-image'] || (props as any)?.['data-link-image'] || '';
              
              try {
                const decodedUrl = decodeURIComponent(url);
                const decodedTitle = decodeURIComponent(title);
                const decodedDescription = decodeURIComponent(description);
                const decodedImage = decodeURIComponent(image);
                
                return (
                  <LinkCard
                    url={decodedUrl}
                    title={decodedTitle || undefined}
                    description={decodedDescription || undefined}
                    image={decodedImage || undefined}
                  >
                    {decodedTitle}
                  </LinkCard>
                );
              } catch (e) {
                console.error('Failed to decode link-card attributes:', e);
                return null;
              }
            }
            
      // Default div rendering
      return <div className={className} {...props}>{children}</div>;
    },
  }), []);

  return (
    <div ref={containerRef} className="font-sans text-base leading-loose text-slate-800 dark:text-slate-200 markdown-content">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents as any}
      >
        {processedContent}
      </Markdown>
    </div>
  );
});

export default MarkdownRenderer;
