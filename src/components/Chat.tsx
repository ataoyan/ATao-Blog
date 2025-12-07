import React, { useMemo, memo } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { baseMarkdownComponents } from './MarkdownElements';

interface ChatMessage {
  person: {
    name: string;
    avatar?: string;
  };
  content: string;
}

interface ChatProps {
  children?: React.ReactNode;
  messages?: ChatMessage[];
}

const Chat: React.FC<ChatProps> = ({ children, messages: propMessages }) => {
  // Parse messages from children if not provided as prop
  const messages = useMemo(() => {
    if (propMessages) return propMessages;
    
    if (!children) return [];
    
    // Convert children to string for parsing
    let content = '';
    if (typeof children === 'string') {
      content = children;
    } else {
      content = React.Children.toArray(children)
        .map(child => {
          if (typeof child === 'string') return child;
          if (typeof child === 'number') return String(child);
          if (typeof child === 'object' && 'props' in child) {
            return extractTextFromNode(child);
          }
          return '';
        })
        .join('\n');
    }
    
    if (!content.trim()) {
      return [];
    }
    
    const parsed = parseChatContent(content);
    return parsed;
  }, [children, propMessages]);

  if (messages.length === 0) return null;

  // Memoize markdown components for chat messages
  const markdownComponents = useMemo(() => ({
    ...baseMarkdownComponents,
    // Customize image rendering for chat
    img: ({ src, alt, ...props }: any) => {
      return (
        <img
          src={src}
          alt={alt}
          className="max-w-[200px] rounded-lg my-1 cursor-pointer hover:opacity-90 transition-opacity"
          {...props}
        />
      );
    },
    // Customize paragraph for chat bubbles
    p: ({ children, ...props }: any) => {
      return <div className="mb-1 last:mb-0" {...props}>{children}</div>;
    },
  }), []);

  return (
    <div className="my-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="flex gap-3">
             {/* Avatar */}
             <div className="flex-shrink-0 relative w-10 h-10 rounded-lg overflow-hidden border-2 border-white dark:border-slate-700 bg-slate-200 dark:bg-slate-600">
               {message.person.avatar ? (
                 <img
                   src={message.person.avatar}
                   alt={message.person.name}
                   className="absolute inset-0 w-full h-full object-cover object-center"
                   style={{
                     objectPosition: 'center center',
                   }}
                   onError={(e) => {
                     // If image fails to load, hide it and show default
                     const img = e.target as HTMLImageElement;
                     img.style.display = 'none';
                     const parent = img.parentElement;
                     if (parent && !parent.querySelector('.avatar-fallback')) {
                       const fallback = document.createElement('div');
                       fallback.className = 'avatar-fallback w-full h-full rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm absolute inset-0';
                       fallback.textContent = message.person.name.charAt(0).toUpperCase();
                       parent.appendChild(fallback);
                     }
                   }}
                 />
               ) : (
                 <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                   {message.person.name.charAt(0).toUpperCase()}
                 </div>
               )}
             </div>

            {/* Message content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                {message.person.name}
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-600">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents as any}
                >
                  {message.content}
                </Markdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to extract text from React nodes
function extractTextFromNode(node: any): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('\n');
  if (node && typeof node === 'object') {
    if ('props' in node && node.props) {
      if (node.props.children) {
        return extractTextFromNode(node.props.children);
      }
    }
  }
  return '';
}

// Get Minecraft avatar URL from player name
// Uses mc-heads.net API which supports direct username lookup
function getMinecraftAvatar(username: string): string {
  // Minecraft usernames are 3-16 characters, alphanumeric and underscores only
  const minecraftNamePattern = /^[a-zA-Z0-9_]{3,16}$/;
  
  if (minecraftNamePattern.test(username)) {
    // Use mc-heads.net API - supports direct username lookup
    // Format: https://mc-heads.net/avatar/{username}
    return `https://mc-heads.net/avatar/${encodeURIComponent(username)}`;
  }
  
  return '';
}

// Parse chat content from markdown-like syntax
// Format:
// @person name:张三, avatar:https://example.com/avatar.jpg
// 消息内容
// @person name:PlayerName (Minecraft player, auto-detect avatar)
// 另一条消息
function parseChatContent(content: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (!content || !content.trim()) {
    return messages;
  }
  
  // Split by \n and remove \r from each line
  const lines = content.split(/\r?\n/).map(line => line.replace(/\r$/, '').trimEnd());
  
  let currentPerson: { name: string; avatar?: string } | null = null;
  let currentContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line is a person declaration (must be at start of line)
    const personMatch = line.match(/^@person\s+(.+)$/);
    if (personMatch) {
      // Save previous message if exists
      if (currentPerson) {
        const messageContent = currentContent.join('\n').trim();
        if (messageContent) {
          messages.push({
            person: currentPerson,
            content: messageContent,
          });
        }
        currentContent = [];
      }
      
      // Parse person attributes
      const attrs = personMatch[1].trim();
      
      // Parse name - handle various formats: name:value, name:"value", name:'value'
      // Match name: followed by value (can be quoted or unquoted, ends at comma or end of string)
      let nameMatch = attrs.match(/name:\s*['"]?([^,'"]+)['"]?/i);
      if (!nameMatch) {
        // Fallback: match everything after name: until comma or end
        nameMatch = attrs.match(/name:\s*([^,]+?)(?:\s*,\s*|$)/i);
      }
      if (!nameMatch) {
        // Last resort: match name: followed by any non-whitespace
        nameMatch = attrs.match(/name:\s*(\S+)/i);
      }
      
      const avatarMatch = attrs.match(/avatar:\s*['"]?([^,'"]+)['"]?/i);
      
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      let avatar = avatarMatch ? avatarMatch[1].trim() : undefined;
      
      // Only get Minecraft avatar if explicitly requested with avatar:minecraft
      if (avatar && avatar.toLowerCase() === 'minecraft') {
        const minecraftAvatar = getMinecraftAvatar(name);
        if (minecraftAvatar) {
          avatar = minecraftAvatar;
        } else {
          // If Minecraft avatar fetch fails, use default (no avatar)
          avatar = undefined;
        }
      }
      
      currentPerson = {
        name,
        avatar,
      };
    } else if (currentPerson) {
      // Add line to current message content (including empty lines)
      currentContent.push(line);
    }
  }
  
  // Add last message
  if (currentPerson && currentContent.length > 0) {
    const messageContent = currentContent.join('\n').trim();
    if (messageContent) {
      messages.push({
        person: currentPerson,
        content: messageContent,
      });
    }
  }
  
  return messages;
}

export default memo(Chat);

