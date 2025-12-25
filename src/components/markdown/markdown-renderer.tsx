"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Code block with copy button
function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    // Extract text content from the code block
    const codeElement = document.createElement("div");
    codeElement.innerHTML =
      typeof children === "string"
        ? children
        : Array.isArray(children)
        ? children
            .map((child: any) =>
              typeof child === "string" ? child : child?.props?.children || ""
            )
            .join("")
        : "";

    // Get the text content, handling nested elements
    let textContent = "";
    const extractText = (node: any): string => {
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(extractText).join("");
      if (node?.props?.children) return extractText(node.props.children);
      return "";
    };
    textContent = extractText(children);

    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, [children]);

  return (
    <div className="relative group">
      <pre
        className="overflow-x-auto rounded-lg bg-muted p-4 mb-3 text-sm font-mono border pr-12"
        {...props}
      >
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border/50 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   hover:bg-muted hover:border-border focus:opacity-100 focus:outline-none"
        title={copied ? "Copied!" : "Copy code"}
        aria-label={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

// Inline code with optional copy on click
function InlineCode({ children, ...props }: any) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const text = typeof children === "string" ? children : String(children);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [children]);

  return (
    <code
      className={`px-1.5 py-0.5 rounded bg-muted text-sm font-mono cursor-pointer 
                  hover:bg-muted/80 transition-colors ${copied ? "ring-2 ring-green-500/50" : ""}`}
      onClick={handleClick}
      title="Click to copy"
      {...props}
    >
      {children}
      {copied && (
        <span className="ml-1 text-xs text-green-600">✓</span>
      )}
    </code>
  );
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-3 mb-2 first:mt-0" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-xs font-semibold mt-2 mb-1 first:mt-0" {...props} />
          ),
          
          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-3 last:mb-0 leading-relaxed" {...props} />
          ),
          
          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 ml-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 ml-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="ml-2" {...props} />
          ),
          
          // Code blocks with copy button
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className?.includes("hljs");
            
            if (isInline) {
              return <InlineCode {...props}>{children}</InlineCode>;
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, children, ...props }) => (
            <CodeBlock {...props}>{children}</CodeBlock>
          ),
          
          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-muted-foreground/30 pl-4 italic my-3 text-muted-foreground"
              {...props}
            />
          ),
          
          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          
          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border-b border-border" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-border px-4 py-2 text-left font-semibold text-sm"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-border px-4 py-2 text-sm"
              {...props}
            />
          ),
          
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-border" {...props} />
          ),
          
          // Strong and emphasis
          strong: ({ node, ...props }) => (
            <strong className="font-semibold" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic" {...props} />
          ),
          
          // Mark/highlight (for highlighted content)
          mark: ({ node, className, ...props }: any) => (
            <mark className={className} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
