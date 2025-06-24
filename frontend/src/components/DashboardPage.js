import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './DashboardPage.css'; // Import the CSS file
// import { Button } from "@/components/ui/button"; // Not available in CRA by default
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Not available
// import { Settings, Plus, Grid2X2, MoreVertical, ChevronDown, Check } from "lucide-react"; // Might not be installed

// --- Mock/Placeholder UI Components (similar to HomePage.js) ---
// These would ideally be proper reusable components or from a UI library.

const Button = ({ children, onClick, className = '', variant = '', size = '' }) => (
  <button
    onClick={onClick}
    className={`${className} dashboard-button ${variant === 'outline' ? 'dashboard-button-outline' : ''} ${variant === 'ghost' ? 'dashboard-button-ghost' : ''} ${size === 'sm' ? 'dashboard-button-sm' : ''}`}
  >
    {children}
  </button>
);

const Avatar = ({ children, className = '' }) => (
  <div className={`${className} dashboard-avatar`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt }) => (
  <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
);

const AvatarFallback = ({ children, className = '' }) => (
  <div className={`${className} dashboard-avatar-fallback`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', borderRadius: '50%' }}>
    {children}
  </div>
);

// Mock Lucide Icons
const SettingsIcon = () => <span role="img" aria-label="settings">⚙️</span>;
const PlusIcon = () => <span role="img" aria-label="plus">+</span>;
const Grid2X2Icon = () => <span role="img" aria-label="grid view">▩</span>;
const MoreVerticalIcon = () => <span role="img" aria-label="more options">⋮</span>;
const ChevronDownIcon = () => <span role="img" aria-label="chevron down">⌄</span>;
// Custom List Icon with Check (complex to do inline, using simple placeholder)
const ListIconWithCheck = ({isActive}) => isActive ? <span role="img" aria-label="list view active">✓☰</span> : <span role="img" aria-label="list view">☰</span>;


// Placeholder for Dropdown component
const Dropdown = ({ value, onChange, options, className = '' }) => (
  <div className={`dashboard-dropdown ${className}`}>
    <Button variant="outline" className="dashboard-dropdown-button">
      {value}
      <ChevronDownIcon />
    </Button>
    {/* Actual dropdown list would be rendered here on click */}
  </div>
);

// Placeholder for NotebookList component (Table)
const NotebookListTable = ({ notebooks }) => (
  <table className="dashboard-notebook-table">
    <thead>
      <tr>
        <th>标题</th>
        <th>来源数量</th>
        <th>创建时间</th>
        <th>角色</th>
        <th></th> {/* Actions */}
      </tr>
    </thead>
    <tbody>
      {notebooks.map((notebook) => (
        <tr key={notebook.id}>
          <td>{notebook.title}</td>
          <td>{notebook.sourceCount} 个来源</td>
          <td>{notebook.createdAt}</td>
          <td>{notebook.role}</td>
          <td>
            <Button variant="ghost" size="sm">
              <MoreVerticalIcon />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
// --- End Mock/Placeholder UI Components ---

const DashboardPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [currentView, setCurrentView] = useState('list');
  const [sortBy, setSortBy] = useState('最近');

  const notebooks = [
    { id: '1', title: 'My First Notebook', sourceCount: 2, createdAt: '2025年6月4日', role: 'Owner' },
    { id: '2', title: 'Project Phoenix Notes', sourceCount: 10, createdAt: '2025年6月3日', role: 'Owner' },
    { id: '3', title: '中文笔记本示例', sourceCount: 0, createdAt: '2025年6月5日', role: 'Owner' },
  ];

  // Basic sort for example
  const sortedNotebooks = [...notebooks].sort((a, b) => {
    if (sortBy === '最近' || sortBy === '创建时间') {
      return new Date(b.createdAt.replace('年', '-').replace('月', '-').replace('日', '')) - new Date(a.createdAt.replace('年', '-').replace('月', '-').replace('日', ''));
    }
    if (sortBy === '标题') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return (
    <div className="dashboard-min-h-screen dashboard-bg-white dashboard-flex-col">
      {/* Header Bar */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          {/* Left Side: Logo */}
          <div className="dashboard-logo-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dashboard-logo-icon">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V19.5A2.5 2.5 0 0 1 17.5 22H6.5A2.5 2.5 0 0 1 4 19.5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 17V4.5A2.5 2.5 0 0 1 6.5 2H17.5A2.5 2.5 0 0 1 20 4.5V17H4Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 7h8M8 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h1 className="dashboard-logo-text">KnowmeLM</h1>
          </div>

          {/* Right Side Controls */}
          <div className="dashboard-controls-container">
            <Button variant="outline" size="sm" className="dashboard-settings-button">
              <SettingsIcon />
              <span style={{ marginLeft: '0.25rem' }}>设置</span>
            </Button>
            <div className="dashboard-pro-tag">PRO</div>
            <button className="dashboard-app-switcher">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="dashboard-waffle-icon">
                <path fillRule="evenodd" clipRule="evenodd" d="M4 4C4.55228 4 5 4.44772 5 5C5 5.55228 4.55228 6 4 6C3.44772 6 3 5.55228 3 5C3 4.44772 3.44772 4 4 4ZM4 9C4.55228 9 5 9.44772 5 10C5 10.5523 4.55228 11 4 11C3.44772 11 3 10.5523 3 10C3 9.44772 3.44772 9 4 9ZM5 15C5 14.4477 4.55228 14 4 14C3.44772 14 3 14.4477 3 15C3 15.5523 3.44772 16 4 16C4.55228 16 5 15.5523 5 15ZM9 4C9.55228 4 10 4.44772 10 5C10 5.55228 9.55228 6 9 6C8.44772 6 8 5.55228 8 5C8 4.44772 8.44772 4 9 4ZM10 10C10 9.44772 9.55228 9 9 9C8.44772 9 8 9.44772 8 10C8 10.5523 8.44772 11 9 11C9.55228 11 10 10.5523 10 10ZM9 14C9.55228 14 10 14.4477 10 15C10 15.5523 9.55228 16 9 16C8.44772 16 8 15.5523 8 15C8 14.4477 8.44772 14 9 14ZM14 4C14.5523 4 15 4.44772 15 5C15 5.55228 14.5523 6 14 6C13.4477 6 13 5.55228 13 5C13 4.44772 13.4477 4 14 4ZM15 10C15 9.44772 14.5523 9 14 9C13.4477 9 13 9.44772 13 10C13 10.5523 13.4477 11 14 11C14.5523 11 15 10.5523 15 10ZM14 14C14.5523 14 15 14.4477 15 15C15 15.5523 14.5523 16 14 16C13.4477 16 13 15.5523 13 15C13 14.4477 13.4477 14 14 14Z" />
              </svg>
            </button>
            <div className="dashboard-avatar-container"> {/* For gradient border */}
              <Avatar className="dashboard-user-avatar">
                <AvatarImage src="https://images.unsplash.com/photo-1500673922987-e212871fec22?w=64&h=64&fit=crop&crop=face" alt="User Avatar" />
                <AvatarFallback className="dashboard-avatar-fallback-icon">🚀</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main-content">
        {/* Welcome Section */}
        <div className="dashboard-welcome-section">
          <h2 className="dashboard-welcome-title">欢迎使用 KnowmeLM</h2>
          <Button className="dashboard-new-button" onClick={() => navigate('/app')}>
            <PlusIcon />
            <span style={{ marginLeft: '0.5rem' }}>新建</span>
          </Button>
        </div>

        {/* Notebook List Section */}
        <div className="dashboard-notebook-list-section">
          {/* List Toolbar */}
          <div className="dashboard-list-toolbar">
            {/* View Toggle */}
            <div className="dashboard-view-toggle">
              <button
                onClick={() => setCurrentView('grid')}
                title="网格视图"
                className={`dashboard-view-button ${currentView === 'grid' ? 'active' : ''}`}
              >
                <Grid2X2Icon />
              </button>
              <button
                onClick={() => setCurrentView('list')}
                title="列表视图"
                className={`dashboard-view-button ${currentView === 'list' ? 'active' : ''}`}
              >
                <ListIconWithCheck isActive={currentView === 'list'} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <Dropdown
              value={sortBy}
              onChange={setSortBy}
              options={['最近', '标题', '创建时间']}
              className="dashboard-sort-dropdown"
            />
          </div>

          {/* Notebook List */}
          {currentView === 'list' ? (
            <NotebookListTable notebooks={sortedNotebooks} />
          ) : (
            <div className="dashboard-grid-view-placeholder">Grid view not implemented yet.</div>
          )}
        </div>
      </main>
      {/* <style jsx global> block removed */}
    </div>
  );
};

export default DashboardPage;
