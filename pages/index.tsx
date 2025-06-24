import { useState } from "react";
import { useRouter } from 'next/router'; // Import useRouter
import { Button } from "@/components/ui/button";
// import { Dropdown } from "@/components/Dropdown"; // Keep original imports if they exist
// import { NotebookList } from "@/components/NotebookList"; // Keep original imports if they exist
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Grid2X2, Plus, Settings } from "lucide-react";

const Index = () => {
  const router = useRouter(); // Initialize useRouter
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('最近');

  // Mock components if they don't exist, for compilation
  // These would typically be imported from their actual paths
  // Assuming Dropdown and NotebookList might not be fully set up in the provided environment
  const MockDropdown: React.FC<any> = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="p-2 border rounded">
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
  const MockNotebookList: React.FC<any> = ({ currentView }: { currentView: 'grid' | 'list' }) => (
    <div className="p-4 border rounded mt-4">Displaying notebooks in {currentView} view. (Placeholder)</div>
  );

  const handleCreateNew = () => {
    router.push('/dashboard'); // Navigate to dashboard page
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <header className="w-full border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 text-black">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" fill="currentColor"/>
                <path d="M6 4h12v16H6V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-black">NotebookLM</h1>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="text-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            <div className="px-3 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700">
              PRO
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <Grid2X2 className="w-5 h-5 text-gray-600" />
            </button>
            <Avatar className="w-10 h-10 ring-4 ring-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
              <AvatarImage src="https://images.unsplash.com/photo-1500673922987-e212871fec22?w=64&h=64&fit=crop&crop=face" alt="User Avatar" />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white">
                🚀
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-black mb-8 tracking-tight">
            欢迎使用 NotebookLM
          </h2>
          <Button
            className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            onClick={handleCreateNew} // Updated onClick handler
          >
            <Plus className="w-5 h-5 mr-2" />
            新建
          </Button>
        </div>

        {/* Notebook List Section */}
        <div className="space-y-6">
          {/* List Toolbar */}
          <div className="flex items-center justify-between">
            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setCurrentView('grid')}
                className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                  currentView === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                  currentView === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="w-4 h-4 flex flex-col justify-center space-y-0.5">
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                </div>
              </button>
            </div>

            {/* Sort Dropdown */}
            {/* Using MockDropdown as Dropdown component from "@/components/Dropdown" might not exist in this context */}
            <MockDropdown
              value={sortBy}
              onChange={setSortBy}
              options={['最近', '标题', '创建时间']}
            />
          </div>

          {/* Notebook List */}
          {/* Using MockNotebookList as NotebookList component from "@/components/NotebookList" might not exist */}
          <MockNotebookList currentView={currentView} />
        </div>
      </main>
    </div>
  );
};

export default Index;
