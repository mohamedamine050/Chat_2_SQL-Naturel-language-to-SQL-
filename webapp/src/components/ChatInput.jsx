import { Send, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

const ChatInput = ({ question, setQuestion, onSubmit, loading, clearHistory }) => {
  const inputRef = useRef(null);

  // Auto-focus input when not loading
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading && question.trim()) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={onSubmit} className="chat-input-form">
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your database (e.g. 'Show me all customers from NY')"
            className="chat-input"
            disabled={loading}
            onKeyDown={handleKeyDown}
            aria-label="Type your question"
          />
          
          <div className="button-group">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="send-button"
              aria-label={loading ? "Processing" : "Send message"}
            >
              {loading ? (
                <Loader2 className="button-icon spin-animation" size={18} />
              ) : (
                <Send className="button-icon" size={18} />
              )}
            </button>

            <button
              type="button"
              onClick={clearHistory}
              className="clear-button"
              title="Clear conversation history"
              aria-label="Clear conversation history"
              disabled={loading}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;