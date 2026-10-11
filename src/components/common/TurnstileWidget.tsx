import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (error: any) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          action?: string;
          cData?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export interface TurnstileWidgetRef {
  reset: () => void;
  getResponse: () => string | undefined;
}

export interface TurnstileWidgetProps {
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: any) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  action?: string;
  className?: string;
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onVerify, onExpire, onError, theme = 'light', size = 'normal', action = 'auth', className = '' }, ref) => {
    const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'verified' | 'expired' | 'error'>(
      siteKey ? 'loading' : 'idle'
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Keep callback refs fresh
    const onVerifyRef = useRef(onVerify);
    onVerifyRef.current = onVerify;
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const resetWidget = useCallback(() => {
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
          setStatus('ready');
          setErrorMessage(null);
        } catch (err) {
          console.warn('Failed to reset Turnstile widget:', err);
        }
      }
    }, []);

    const getResponse = useCallback(() => {
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
        try {
          return window.turnstile.getResponse(widgetIdRef.current);
        } catch {
          return undefined;
        }
      }
      return undefined;
    }, []);

    useImperativeHandle(ref, () => ({
      reset: resetWidget,
      getResponse
    }), [resetWidget, getResponse]);

    useEffect(() => {
      if (!siteKey) {
        setStatus('idle');
        return;
      }

      let isMounted = true;

      const renderWidget = () => {
        if (!isMounted || !containerRef.current || !window.turnstile) return;

        // Clean up any existing widget before re-rendering
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            action,
            callback: (token: string) => {
              if (!isMounted) return;
              setStatus('verified');
              setErrorMessage(null);
              onVerifyRef.current?.(token);
            },
            'expired-callback': () => {
              if (!isMounted) return;
              setStatus('expired');
              onExpireRef.current?.();
            },
            'error-callback': (err: any) => {
              if (!isMounted) return;
              setStatus('error');
              const msg = typeof err === 'string' ? err : 'Verification failed. Please retry.';
              setErrorMessage(msg);
              onErrorRef.current?.(err);
            }
          });
          widgetIdRef.current = id;
          setStatus('ready');
        } catch (err: any) {
          console.warn('Turnstile render error:', err);
          if (isMounted) {
            setStatus('error');
            setErrorMessage('Unable to initialize verification widget.');
          }
        }
      };

      // Load script if not already present
      if (typeof window !== 'undefined' && window.turnstile) {
        renderWidget();
      } else {
        let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = TURNSTILE_SCRIPT_ID;
          script.src = TURNSTILE_SRC;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        const handleScriptLoad = () => {
          renderWidget();
        };

        script.addEventListener('load', handleScriptLoad);

        // Fallback polling in case script is already loaded but event fired
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 100);

        return () => {
          isMounted = false;
          clearInterval(checkInterval);
          script?.removeEventListener('load', handleScriptLoad);
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {}
            widgetIdRef.current = null;
          }
        };
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }
      };
    }, [siteKey, theme, size, action]);

    // If no site key is configured, Turnstile is not active
    if (!siteKey) {
      return null;
    }

    return (
      <div className={`turnstile-container flex flex-col items-center justify-center my-2 ${className}`}>
        {status === 'loading' && (
          <div className="text-[11px] text-slate-400 py-2 animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
            <span>Loading security verification...</span>
          </div>
        )}
        <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
        {status === 'expired' && (
          <p className="text-[10px] text-amber-600 mt-1 font-medium">
            Verification expired. Please re-verify above.
          </p>
        )}
        {status === 'error' && (
          <p className="text-[10px] text-red-600 mt-1 font-medium">
            {errorMessage || 'Verification error. Please refresh or retry.'}
          </p>
        )}
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
