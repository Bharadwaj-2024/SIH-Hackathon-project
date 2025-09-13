import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ThemeContext = createContext();

const initialState = {
  darkMode: localStorage.getItem('darkMode') === 'true' || false,
};

const themeReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        darkMode: !state.darkMode,
      };
    case 'SET_DARK_MODE':
      return {
        ...state,
        darkMode: action.payload,
      };
    default:
      return state;
  }
};

export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', state.darkMode.toString());
  }, [state.darkMode]);

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const setDarkMode = (isDark) => {
    dispatch({ type: 'SET_DARK_MODE', payload: isDark });
  };

  const value = {
    ...state,
    toggleDarkMode,
    setDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};