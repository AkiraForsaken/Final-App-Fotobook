import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PAGE_SIZE, useOffsetPagination } from '../../hooks/useOffsetPagination.ts';
import { adminService } from '../../service/adminService.ts';
import { Button } from '../../components/myUI/Button.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { routeUtils } from '../../utils/routes.ts';
import type { Album } from '../../types/index.ts';

export const ManageAlbums = () => {
	const navigate = useNavigate();
	const { items, page, totalPages, loading, goToPage, refetch } = useOffsetPagination<Album>(
		adminService.listAlbums,
		PAGE_SIZE
	);

	const [confirmId, setConfirmId] = useState<number | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleDelete = async (albumId: number) => {
		if (confirmId !== albumId) {
			setConfirmId(albumId);
			return;
		}
		setBusyId(albumId);
		setError(null);
		try {
			await adminService.deleteAlbum(albumId);
			await refetch();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete album.');
		} finally {
			setBusyId(null);
			setConfirmId(null);
		}
	};

	if (loading && items.length === 0) {
		return <div className="text-center py-20 text-text-muted">Loading albums...</div>;
	}

	return (
		<div className="w-full mx-auto">
			<h1 className="text-xl font-semibold text-text-primary mb-6">Manage Albums</h1>

			{error && (
				<div className="mb-4 rounded-lg bg-error-bg border border-red-200 p-4 text-sm text-red-800">
					{error}
				</div>
			)}

			{items.length === 0 ? (
				<div className="text-center py-20 text-text-muted">No albums in the system yet.</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{items.map((album) => (
						<div
							key={album.id}
							className="bg-surface rounded-lg border border-border overflow-hidden"
						>
							<div className="relative aspect-square bg-bg-page">
								<img
									src={album.coverImageUrl}
									alt={album.title}
									className="h-full w-full object-cover"
								/>
								<span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
									<i className="fa-solid fa-images mr-1" />
									{album.imageUrls.length}
								</span>
								{album.sharingMode === 'private' && (
									<span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
										<i className="fa-solid fa-lock mr-1" />
										Private
									</span>
								)}
							</div>
							<div className="p-3">
								<p className="font-medium text-text-primary truncate">{album.title}</p>
								<p className="text-xs text-text-secondary truncate">
									by {album.author.firstName} {album.author.lastName}
								</p>
								<div className="mt-3 flex gap-2">
									<Button
										size="sm"
										variant="ghost"
										className="flex-1"
										onClick={() => navigate(routeUtils.getEditAlbum(album.id))}
									>
										Edit
									</Button>
									{confirmId === album.id ? (
										<Button
											size="sm"
											variant="danger"
											className="flex-1"
											disabled={busyId === album.id}
											onClick={() => handleDelete(album.id)}
										>
											Confirm
										</Button>
									) : (
										<Button
											size="sm"
											variant="danger"
											className="flex-1"
											onClick={() => handleDelete(album.id)}
										>
											Delete
										</Button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
		</div>
	);
};
