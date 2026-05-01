import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Message } from "../../types/conversation";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (!message.content) {
    return (
      <div className="flex justify-start">
        <div className="rounded-2xl bg-[hsl(var(--muted))] px-4 py-2.5 text-sm">
          <span className="animate-pulse opacity-50">●●●</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[hsl(var(--primary))] text-white"
            : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? "");
                const isBlock = match !== null;
                return isBlock ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="!my-2 !rounded-lg !text-xs"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return <ul className="mb-2 list-disc pl-4">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="mb-2 list-decimal pl-4">{children}</ol>;
              },
              li({ children }) {
                return <li className="mb-0.5">{children}</li>;
              },
              h1({ children }) {
                return <h1 className="mb-2 text-base font-bold">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="mb-2 text-sm font-bold">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="mb-1 text-sm font-semibold">{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="my-2 border-l-2 border-[hsl(var(--border))] pl-3 italic opacity-80">
                    {children}
                  </blockquote>
                );
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline opacity-80 hover:opacity-100"
                  >
                    {children}
                  </a>
                );
              },
              table({ children }) {
                return (
                  <div className="my-2 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">{children}</table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border border-[hsl(var(--border))] bg-black/5 px-2 py-1 text-left font-semibold">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="border border-[hsl(var(--border))] px-2 py-1">{children}</td>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
