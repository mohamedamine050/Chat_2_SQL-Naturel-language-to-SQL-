import { useState } from "react";
import Sidebar from "../components/SideBar";
import { testDbConnection } from "../services/api";
import { Database, X, Check } from "lucide-react";

const HomePage = () => {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    db_name: "",
    db_password: "",
    db_user: "",
    db_host: "localhost",
    db_port: 3306,
  });
  const [responseMsg, setResponseMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseMsg(null);

    try {
      const data = await testDbConnection(formData);
      
      if (data.error) {
        setResponseMsg({ type: "error", text: data.error });
      } else {
        setResponseMsg({ type: "success", text: "Database connection successful!" });
        setTimeout(() => {
          window.location.href = "/chat";
        }, 1500);
      }
    } catch (error) {
      setResponseMsg({ 
        type: "error", 
        text: error.message || "Failed to connect to database" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-page">
      <Sidebar />

      <div className="home-page-content">
        <div className="welcome-container">
          <Database size={48} className="welcome-icon" />
          <h1>Welcome to SQL Assistant</h1>
          <p className="subtitle">
            Connect to your database to start chatting with your SQL assistant
          </p>

          <button 
            className="connect-button"
            onClick={() => setShowForm(true)}
          >
            Connect to Database
          </button>
        </div>

        {showForm && (
          <div className="modal-backdrop">
            <div className="modal">
              <div className="modal-header">
                <h2>Database Connection</h2>
                <button 
                  className="close-button"
                  onClick={() => {
                    setShowForm(false);
                    setResponseMsg(null);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    Database Name
                    <input 
                      type="text" 
                      name="db_name" 
                      value={formData.db_name} 
                      onChange={handleChange} 
                      placeholder="my_database"
                      required
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Username
                    <input 
                      type="text" 
                      name="db_user" 
                      value={formData.db_user} 
                      onChange={handleChange} 
                      placeholder="username"
                      required
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Password
                    <input 
                      type="password" 
                      name="db_password" 
                      value={formData.db_password} 
                      onChange={handleChange} 
                      placeholder="••••••••"
                      required
                    />
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Host
                      <input 
                        type="text" 
                        name="db_host" 
                        value={formData.db_host} 
                        onChange={handleChange} 
                        placeholder="localhost"
                        required
                      />
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      Port
                      <input 
                        type="number" 
                        name="db_port" 
                        value={formData.db_port} 
                        onChange={handleChange} 
                        placeholder="3306"
                      />
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="secondary-button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="primary-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Connecting..." : "Test Connection"}
                    {!isLoading && responseMsg?.type === "success" && (
                      <Check size={18} className="icon-success" />
                    )}
                  </button>
                </div>

                {responseMsg && (
                  <div className={`response-message ${responseMsg.type}`}>
                    {responseMsg.text}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;