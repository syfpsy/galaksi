import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL CLIENT ERROR:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#030712] flex items-center justify-center p-6 select-none font-sans text-slate-100">
          <div className="stellaris-outliner border border-rose-500/60 rounded-sm p-6 max-w-lg w-full shadow-2xl bg-[#09111c] text-center space-y-4">
            <div className="w-12 h-12 rounded-sm bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-base font-bold font-display uppercase tracking-widest text-rose-300">
              Galaktik Arayüz Başlatma Hatası
            </h1>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              İstemci yüklenirken beklenmeyen bir durum oluştu. Tarayıcı önbelleği veya eski bir durum uyumsuzluk yaratmış olabilir.
            </p>
            {this.state.error && (
              <div className="bg-[#050b14] border border-[#1b3447] p-3 rounded text-left text-[11px] font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="stellaris-btn-metallic px-4 py-2 rounded-sm text-xs font-mono font-bold text-cyan-300 cursor-pointer"
              >
                Sayfayı Yenile
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch {}
                  window.location.reload();
                }}
                className="stellaris-btn-metallic !border-rose-500/60 px-4 py-2 rounded-sm text-xs font-mono font-bold text-rose-300 cursor-pointer"
              >
                Önbelleği Temizle & Sıfırla
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

