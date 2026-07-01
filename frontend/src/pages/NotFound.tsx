import { NavLink } from 'react-router';

const NotFound = () => {
	return (
		<div className="flex flex-col h-full items-center justify-center gap-2 text-text-secondary">
			<h1 className="text-5xl text-black font-bold">404 : Not Found</h1>
			<p className="text-lg">This page does not exist. Click here to return.</p>
			<NavLink
				className={
					'bg-blue-800 p-2 text-white hover:bg-blue-700 focus-visible:outline-blue-800 rounded'
				}
				to={'/discover'}
			>
				Go back to discover page
			</NavLink>
		</div>
	);
};

export default NotFound;
