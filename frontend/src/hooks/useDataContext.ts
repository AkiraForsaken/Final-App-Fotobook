import { useContext } from 'react';
import { DataContext } from '../contexts/DataContext.tsx';
export const useDataContext = () => {
	const context = useContext(DataContext);
	if (!context) {
		throw new Error('useDataContext must be used within a DataProvider');
	}
	return context;
};
