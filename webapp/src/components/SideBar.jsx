import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Code, Database } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { id: 'Chat', label: 'Chat', icon: MessageCircle, url: '/chat' },
    { id: 'Éditeur SQL', label: 'SQL Editor', icon: Code, url: '/ex_sql' },
    { id: 'Schema', label: 'Database Schema', icon: Database, url: '/schema' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Chat2SQL</h1>
        <p className="sidebar-subtitle">AI-powered database assistant</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.url;

          return (
            <Link
              key={item.id}
              to={item.url}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <div className="sidebar-icon-wrapper">
                <IconComponent className="sidebar-icon" size={20} />
              </div>
              <span className="sidebar-label">{item.label}</span>
              {isActive && <div className="active-indicator" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;