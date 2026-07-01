import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider storageKey="fotobook-theme" defaultTheme="light">
			<App />
		</ThemeProvider>
	</StrictMode>
);
