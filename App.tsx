
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAiResponse } from './services/geminiService';
import type { Message, UserPreferences, LocationData } from './types';
import { ChatInput } from './components/ChatInput';
import { ChatLog } from './components/ChatLog';
import { SettingsModal } from './components/SettingsModal';
import { Header } from './components/Header';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLocation } from './hooks/useLocation';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const [messages, setMessages] = useLocalStorage<Message[]>('chatHistory', []);
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>('userPrefs', {
    name: 'User',
    communicationStyle: 'friendly and helpful',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { location, locationError } = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // State for the new location permission banner
  const [isLocationBannerDismissed, setIsLocationBannerDismissed] = useState(false);
  const [showLocationInstructions, setShowLocationInstructions] = useState(false);


  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleSend = useCallback(async (text: string, imageBase64?: string | null) => {
    setError(null);
    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
      image: imageBase64 ?? undefined,
    };
    addMessage(userMessage);
    setIsLoading(true);

    try {
      const recentHistory = messages.slice(-5);
      const aiResponseText = await getAiResponse(text, imageBase64, recentHistory, preferences, location);
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      addMessage(aiMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get response from AI: ${errorMessage}`);
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error. Please try again. (${errorMessage})`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      addMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [messages, preferences, location, setMessages]);

  const clearHistory = () => {
    setMessages([]);
  };

  const showLocationBanner = locationError?.includes('denied') && !isLocationBannerDismissed;

  return (
    <div className="flex flex-col h-screen font-sans bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-300">
      <Header
        onToggleSettings={() => setIsSettingsOpen(true)}
        onClearHistory={clearHistory}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {showLocationBanner && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4" role="alert">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-bold">Location Access Help</p>
              <p className="text-sm">{locationError}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
               <button 
                 onClick={() => setShowLocationInstructions(prev => !prev)} 
                 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 hover:underline whitespace-nowrap"
               >
                 {showLocationInstructions ? 'Hide Instructions' : 'How to Enable'}
               </button>
               <button onClick={() => setIsLocationBannerDismissed(true)} className="text-xl font-bold leading-none text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100" aria-label="Dismiss">&times;</button>
            </div>
          </div>
          {showLocationInstructions && (
            <div className="mt-3 text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-semibold mb-1">To enable location access:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Look for a location icon (often a map pin) in your browser's address bar.</li>
                <li>Click it and select "Always allow..." or a similar option.</li>
                <li>You may need to reload the page for the changes to take effect.</li>
                <li>Alternatively, go to your browser's settings, find "Site Settings" or "Privacy and Security," and manage permissions for this site.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <ChatLog messages={messages} isLoading={isLoading} />
      </main>
      <footer className="p-4 bg-surface-light dark:bg-surface-dark border-t border-user-gray-light dark:border-user-gray-dark">
         {error && <div className="text-red-500 text-center mb-2">{error}</div>}
         {locationError && !locationError.includes('denied') && (
            <div className="text-yellow-500 text-center mb-2">{locationError}</div>
         )}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSave={setPreferences}
      />
    </div>
  );
};

export default App;
