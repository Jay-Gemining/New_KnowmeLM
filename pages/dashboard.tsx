import { useState, FC } from "react";
import { Button } from "@/components/ui/button";
// Assuming Dropdown and NotebookList might need to be custom or adapted
// import { Dropdown } from "@/components/Dropdown";
// import { NotebookList } from "@/components/NotebookList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Plus, Grid2X2, MoreVertical, ChevronDown, Check } from "lucide-react";

// Placeholder for Dropdown component
interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}

const Dropdown: FC<DropdownProps> = ({ value, onChange, options, className }) => (
  <div className={`relative inline-block text-left ${className}`}>
    <Button variant="outline" className="flex items-center justify-between w-full pr-2">
      {value}
      <ChevronDown className="w-4 h-4 ml-2" />
    </Button>
    {/* Basic dropdown, not functional for now */}
  </div>
);

// Placeholder for NotebookList component
interface NotebookListProps {
  currentView: 'grid' | 'list';
  notebooks: Array<{
    id: string;
    title: string;
    sourceCount: number;
    createdAt: string;
    role: string;
  }>;
}

const NotebookList: FC<NotebookListProps> = ({ currentView, notebooks }) => {
  if (currentView === 'grid') {
    return <div className="text-center py-10">Grid view not implemented yet.</div>;
  }

  return (
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源数量</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {notebooks.map((notebook) => (
          <tr key={notebook.id} className="hover:bg-gray-50 transition-colors">
            <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{notebook.title}</td>
            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{notebook.sourceCount} 个来源</td>
            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{notebook.createdAt}</td>
            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{notebook.role}</td>
            <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};


const DashboardPage = () => {
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('最近');

  // Sample notebook data
  const notebooks = [
    { id: '1', title: 'My First Notebook', sourceCount: 2, createdAt: '2025年6月4日', role: 'Owner' },
    { id: '2', title: 'Project Phoenix Notes', sourceCount: 10, createdAt: '2025年6月3日', role: 'Owner' },
    { id: '3', title: '中文笔记本示例', sourceCount: 0, createdAt: '2025年6月5日', role: 'Owner' },
    { id: '4', title: 'Ideas & Concepts', sourceCount: 5, createdAt: '2025年5月20日', role: 'Owner' },
  ];

  // Sort notebooks based on sortBy state (basic example)
  const sortedNotebooks = [...notebooks].sort((a, b) => {
    if (sortBy === '最近' || sortBy === '创建时间') {
      // Assuming date format is consistent for direct string comparison (YYYY年M月D日)
      // A more robust solution would parse dates
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (sortBy === '标题') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });


  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Bar */}
      <header className="w-full border-b border-gray-200 bg-white px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left Side: Logo */}
          <div className="flex items-center space-x-2">
            {/* Abstract book/document icon placeholder */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V19.5A2.5 2.5 0 0 1 17.5 22H6.5A2.5 2.5 0 0 1 4 19.5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 17V4.5A2.5 2.5 0 0 1 6.5 2H17.5A2.5 2.5 0 0 1 20 4.5V17H4Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 7h8M8 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h1 className="text-xl font-semibold text-black">KnowmeLM</h1>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-50">
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            <div className="px-3 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700">
              PRO
            </div>
            {/* App Switcher (Waffle Icon) */}
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-600">
                <path fillRule="evenodd" clipRule="evenodd" d="M4 4C4.55228 4 5 4.44772 5 5C5 5.55228 4.55228 6 4 6C3.44772 6 3 5.55228 3 5C3 4.44772 3.44772 4 4 4ZM4 9C4.55228 9 5 9.44772 5 10C5 10.5523 4.55228 11 4 11C3.44772 11 3 10.5523 3 10C3 9.44772 3.44772 9 4 9ZM5 15C5 14.4477 4.55228 14 4 14C3.44772 14 3 14.4477 3 15C3 15.5523 3.44772 16 4 16C4.55228 16 5 15.5523 5 15ZM9 4C9.55228 4 10 4.44772 10 5C10 5.55228 9.55228 6 9 6C8.44772 6 8 5.55228 8 5C8 4.44772 8.44772 4 9 4ZM10 10C10 9.44772 9.55228 9 9 9C8.44772 9 8 9.44772 8 10C8 10.5523 8.44772 11 9 11C9.55228 11 10 10.5523 10 10ZM9 14C9.55228 14 10 14.4477 10 15C10 15.5523 9.55228 16 9 16C8.44772 16 8 15.5523 8 15C8 14.4477 8.44772 14 9 14ZM14 4C14.5523 4 15 4.44772 15 5C15 5.55228 14.5523 6 14 6C13.4477 6 13 5.55228 13 5C13 4.44772 13.4477 4 14 4ZM15 10C15 9.44772 14.5523 9 14 9C13.4477 9 13 9.44772 13 10C13 10.5523 13.4477 11 14 11C14.5523 11 15 10.5523 15 10ZM14 14C14.5523 14 15 14.4477 15 15C15 15.5523 14.5523 16 14 16C13.4477 16 13 15.5523 13 15C13 14.4477 13.4477 14 14 14Z" />
              </svg>
            </button>
            <div className="relative">
              <Avatar className="w-9 h-9">
                <AvatarImage src="https://images.unsplash.com/photo-1500673922987-e212871fec22?w=64&h=64&fit=crop&crop=face" alt="User Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white text-sm">
                  🚀
                </AvatarFallback>
              </Avatar>
              {/* Gradient border effect */}
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            </div>
            {/* The above creates a static gradient border. For a true "rainbow" or "spectral" animated border, custom CSS with @keyframes would be needed. */}
            {/* Fallback using a simpler gradient if the above is too complex or causes issues */}
            {/* <Avatar className="w-9 h-9 ring-2 ring-offset-1" style={{ ringColor: 'transparent', backgroundImage: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)', backgroundClip: 'padding-box' }}>
              <AvatarImage src="https://images.unsplash.com/photo-1500673922987-e212871fec22?w=64&h=64&fit=crop&crop=face" alt="User Avatar" />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white text-sm">
                🚀
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-black mb-6 tracking-tight">
            欢迎使用 KnowmeLM
          </h2>
          <Button
            className="bg-black hover:bg-gray-800 text-white px-7 py-3 text-base font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            onClick={() => console.log('Creating new notebook...')}
          >
            <Plus className="w-5 h-5 mr-1.5" />
            新建
          </Button>
        </div>

        {/* Notebook List Section */}
        <div className="space-y-5">
          {/* List Toolbar */}
          <div className="flex items-center justify-between">
            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setCurrentView('grid')}
                title="网格视图"
                className={`px-3 py-2 flex items-center space-x-2 transition-colors ${
                  currentView === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('list')}
                title="列表视图"
                className={`px-3 py-2 flex items-center space-x-2 transition-colors ${
                  currentView === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {/* Custom List icon with Check */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                  <path d="M3.5 4.5H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M3.5 8.5H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M3.5 12.5H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  {currentView === 'list' && <path d="M10.5 11L11.5 12L13.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>}
                </svg>
              </button>
            </div>

            {/* Sort Dropdown */}
            <Dropdown
              value={sortBy}
              onChange={setSortBy}
              options={['最近', '标题', '创建时间']}
              className="w-32"
            />
          </div>

          {/* Notebook List */}
          <NotebookList currentView={currentView} notebooks={sortedNotebooks} />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
