// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import SqlEx from "./pages/SqlEx";
import SchemaPage from "./pages/SchemaPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/ex_sql" element={<SqlEx />} />
        <Route path="/schema" element={<SchemaPage />} />
      </Routes>
    </Router>
  );
};

export default App;
