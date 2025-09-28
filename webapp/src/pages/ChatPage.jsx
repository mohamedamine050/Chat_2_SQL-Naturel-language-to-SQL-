import { useState, useRef, useEffect } from "react";
import { fetchQueryResponse } from "../services/api";
import ChatInput from "../components/ChatInput";
import ResponseCard from "../components/ResponseCard";
import Sidebar from "../components/SideBar";
import { Bot, AlertCircle } from "lucide-react";

const ChatPage = () => {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!question.trim()) return;
  
  setLoading(true);
  setError("");
  const userQuestion = question;
  setQuestion("");

  try {
    // Ne pas ajouter immédiatement le message utilisateur
    // Attendre d'avoir la réponse complète avant d'ajouter les deux messages
    const data = await fetchQueryResponse(userQuestion);
    const timestamp = new Date().toLocaleTimeString();
    
    setResponses(prev => [
      ...prev,
      {
        question: userQuestion,
        timestamp,
        type: "user"
      },
      {
        ...data,
        timestamp,
        type: "bot"
      }
    ]);
  } catch (err) {
    setError(err.message || "Failed to get response. Please try again.");
    const errorTimestamp = new Date().toLocaleTimeString();
    setResponses(prev => [
      ...prev,
      { 
        type: "error", 
        message: "Sorry, I couldn't process your request.", 
        timestamp: errorTimestamp 
      }
    ]);
  } finally {
    setLoading(false);
  }
};
  const clearHistory = () => {
    setResponses([]);
    setError("");
  };

  return (
    <div className="chat-app">
      <Sidebar />
      
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <Bot size={24} className="header-icon" />
            <h1>Database Assistant</h1>
          </div>
          <button 
            onClick={clearHistory}
            className="clear-history-button"
            disabled={responses.length === 0}
          >
            Clear Conversation
          </button>
        </div>

        <div className="messages-container">
          {responses.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-content">
                <Bot size={48} className="empty-icon" />
                <h2>How can I help you today?</h2>
                <p>Ask questions about your database or request SQL queries</p>
              </div>
            </div>
          )}

          {responses.map((response, index) => (
            <ResponseCard 
              key={`${index}-${response.timestamp}`} 
              response={response} 
            />
          ))}

          {loading && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
              <span>Assistant is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <ChatInput
            question={question}
            setQuestion={setQuestion}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;