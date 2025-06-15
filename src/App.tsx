
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-multilat-surface">
      <div className="container-app py-8">
        <div className="card-shadow bg-card p-8 text-center">
          <h1 className="text-4xl text-heading text-multilat-text mb-4">
            Multilat Analysis Tool
          </h1>
          <p className="text-body text-muted-foreground mb-6">
            Diplomatic analytics for inter-session strategy reports
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-multilat-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity focus-visible:outline-multilat-primary">
              Primary Button
            </button>
            <button className="border-2 border-multilat-primary text-multilat-primary px-6 py-3 rounded-lg font-semibold hover:bg-multilat-primary hover:text-white transition-colors focus-visible:outline-multilat-primary">
              Secondary Button
            </button>
          </div>
          <div className="mt-8 text-sm text-multilat-text">
            <p>Design System Test:</p>
            <div className="flex justify-center gap-4 mt-2">
              <div className="w-8 h-8 bg-multilat-primary rounded" title="Primary: #437e84"></div>
              <div className="w-8 h-8 bg-multilat-surface border border-gray-300 rounded" title="Surface: #f6f9f9"></div>
              <div className="w-8 h-8 bg-multilat-text rounded" title="Text: #1a1d1d"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
