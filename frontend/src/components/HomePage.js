import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file
// import { Button } from "@/components/ui/button"; // Assuming this path is not valid for CRA
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming this path is not valid for CRA
// import { Grid2X2, Plus, Settings } from "lucide-react"; // Assuming lucide-react might not be installed

// Mock/Placeholder components for UI elements if not available globally or from a library
// These would ideally be proper reusable components or from a UI library

const Button = ({ children, onClick, className, variant, size }) => (
  <button onClick={onClick} className={`${className} ${variant === 'outline' ? 'button-outline' : 'button-default'} ${size === 'sm' ? 'button-sm' : ''}`}>
    {children}
  </button>
);

const Avatar = ({ children, className }) => (
  <div className={`${className} avatar`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt }) => (
  <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
);

const AvatarFallback = ({ children, className }) => (
  <div className={`${className} avatar-fallback`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', borderRadius: '50%' }}>
    {children}
  </div>
);

// Mock Lucide Icons (simple text placeholders or SVGs if available)
const SettingsIcon = () => <span>⚙️</span>; // Placeholder
const Grid2X2Icon = () => <span>▩</span>; // Placeholder
const PlusIcon = () => <span>+</span>; // Placeholder

const MockDropdown = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="home-dropdown">
    {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const MockNotebookList = ({ currentView }) => (
  <div className="home-notebook-list">Displaying notebooks in {currentView} view. (Placeholder)</div>
);


const HomePage = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('list');
  const [sortBy, setSortBy] = useState('最近');

  const handleCreateNew = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white page-container">
      {/* Header Bar */}
      <header className="w-full border-b border-gray-200 bg-white px-6 py-4 home-header">
        <div className="flex items-center justify-between max-w-7xl mx-auto home-header-content">
          {/* Logo */}
          <div className="flex items-center space-x-3 home-logo-container">
            <div className="w-8 h-8 text-black home-logo-icon-container">
              {/* Original SVG Logo */}
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '24px', height: '24px'}}>
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" fill="currentColor"/>
                <path d="M6 4h12v16H6V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-black home-logo-text">NotebookLM</h1>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-3 home-controls-container">
            <Button variant="outline" size="sm" className="text-gray-700 home-button-settings">
              <SettingsIcon /> {/* Using placeholder */}
              <span style={{marginLeft: '0.5rem'}}>设置</span>
            </Button>
            <div className="px-3 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 home-pro-tag">
              PRO
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors home-grid-button">
              <Grid2X2Icon /> {/* Using placeholder */}
            </button>
            <Avatar className="w-10 h-10 home-avatar">
              {/* Simplified Avatar from original example */}
              <AvatarImage src="https://images.unsplash.com/photo-1500673922987-e212871fec22?w=64&h=64&fit=crop&crop=face" alt="User Avatar" />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white home-avatar-fallback">
                🚀
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 home-main-content">
        {/* Welcome Section */}
        <div className="text-center mb-16 home-welcome-section">
          <h2 className="text-5xl font-bold text-black mb-8 tracking-tight home-welcome-title">
            欢迎使用 NotebookLM
          </h2>
          <Button
            className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 home-button-new"
            onClick={handleCreateNew}
          >
            <PlusIcon /> {/* Using placeholder */}
            <span style={{marginLeft: '0.5rem'}}>新建</span>
          </Button>
        </div>

        {/* Notebook List Section */}
        <div className="space-y-6 home-notebook-section">
          {/* List Toolbar */}
          <div className="flex items-center justify-between home-list-toolbar">
            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden home-view-toggle">
              <button
                onClick={() => setCurrentView('grid')}
                className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                  currentView === 'grid'
                    ? 'bg-blue-500 text-white home-view-button-active'
                    : 'bg-white text-gray-700 hover:bg-gray-50 home-view-button'
                }`}
              >
                <Grid2X2Icon /> {/* Using placeholder */}
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                  currentView === 'list'
                    ? 'bg-blue-500 text-white home-view-button-active'
                    : 'bg-white text-gray-700 hover:bg-gray-50 home-view-button'
                }`}
              >
                {/* Placeholder for list icon */}
                <div className="w-4 h-4 flex flex-col justify-center space-y-0.5 home-list-icon">
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                </div>
              </button>
            </div>

            {/* Sort Dropdown */}
            <MockDropdown
              value={sortBy}
              onChange={setSortBy}
              options={['最近', '标题', '创建时间']}
            />
          </div>

          {/* Notebook List */}
          <MockNotebookList currentView={currentView} />
        </div>
      </main>
      {/* <style jsx global> block removed */}
    </div>
  );
};

export default HomePage;
