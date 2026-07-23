import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PAGE_SIZE, useOffsetPagination } from '../../hooks/useOffsetPagination.ts';
import { adminService } from '../../service/adminService.ts';
import { Button } from '../../components/myUI/Button.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { routeUtils } from '../../utils/routes.ts';
import type { AdminUserSummary } from '../../types/index.ts';

export const ManageUsers = () => {
	const navigate = useNavigate();
	const { items, page, totalPages, loading, goToPage, updateItem, refetch } =
		useOffsetPagination<AdminUserSummary>(adminService.listUsers, PAGE_SIZE);

	const [busyId, setBusyId] = useState<number | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const toggleActive = async (user: AdminUserSummary) => {
		setBusyId(user.id);
		setError(null);
		try {
			if (user.isActive) {
				await adminService.deactivateUser(user.id);
			} else {
				await adminService.reactivateUser(user.id);
			}
			updateItem(user.id, (u) => ({ ...u, isActive: !u.isActive }));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update user status.');
		} finally {
			setBusyId(null);
		}
	};

	const handleDelete = async (userId: number) => {
		if (confirmDeleteId !== userId) {
			setConfirmDeleteId(userId);
			return;
		}
		setBusyId(userId);
		setError(null);
		try {
			await adminService.deleteUser(userId);
			await refetch(); // snaps back a page if this emptied the last one
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete user.');
		} finally {
			setBusyId(null);
			setConfirmDeleteId(null);
		}
	};

	if (loading && items.length === 0) {
		return <div className="text-center py-20 text-text-muted">Loading users...</div>;
	}

	return (
		<div className="w-full mx-auto">
			<h1 className="text-xl font-semibold text-text-primary mb-6">Manage Users</h1>

			{error && (
				<div className="mb-4 rounded-lg bg-error-bg border border-red-200 p-4 text-sm text-red-800">
					{error}
				</div>
			)}

			<div className="bg-surface rounded-xl border border-border shadow-sm overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-bg-page text-left text-text-secondary">
						<tr>
							<th className="px-4 py-3 min-w-[200px] whitespace-nowrap">User</th>
							<th className="px-4 py-3">Email</th>
							<th className="px-4 py-3">Role</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Joined</th>
							<th className="px-4 py-3">Last login</th>
							<th className="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{items.map((user) => (
							<tr key={user.id} className="border-t border-border">
								<td className="px-4 py-3">
									<div className="flex items-center gap-2">
										<span className="font-medium text-text-primary">
											{user.firstName} {user.lastName}
										</span>
									</div>
								</td>
								<td className="px-4 py-3 text-text-secondary">{user.email}</td>
								<td className="px-4 py-3">
									{user.isAdmin ? (
										<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
											Admin
										</span>
									) : (
										<span className="text-text-muted">User</span>
									)}
								</td>
								<td className="px-4 py-3">
									{user.isActive ? (
										<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">
											Active
										</span>
									) : (
										<span className="rounded-full bg-gray-200 px-2 py-0.5 font-medium text-gray-600">
											Inactive
										</span>
									)}
								</td>
								<td className="px-4 py-3 text-text-secondary whitespace-nowrap">
									{new Date(user.createdAt).toLocaleDateString()}
								</td>
								<td className="px-4 py-3 text-text-secondary whitespace-nowrap">
									{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
								</td>
								<td className="px-4 py-3">
									<div className="flex items-center justify-end gap-2 flex-wrap">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => navigate(routeUtils.getAdminEditUser(user.id))}
										>
											Edit
										</Button>
										<Button
											size="sm"
											variant="ghost"
											disabled={busyId === user.id}
											onClick={() => toggleActive(user)}
										>
											{user.isActive ? 'Deactivate' : 'Reactivate'}
										</Button>
										{confirmDeleteId === user.id ? (
											<>
												<Button
													size="sm"
													variant="danger"
													disabled={busyId === user.id}
													onClick={() => handleDelete(user.id)}
												>
													Confirm
												</Button>
												<Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
													Cancel
												</Button>
											</>
										) : (
											<Button size="sm" variant="danger" onClick={() => handleDelete(user.id)}>
												Delete
											</Button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
		</div>
	);
};
