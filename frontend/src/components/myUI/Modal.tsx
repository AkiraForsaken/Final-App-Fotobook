import { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn.ts';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Accessible label for the dialog */
	ariaLabel: string;
	children: React.ReactNode;
	// /** Extra classes on the white panel — use to control max-width/height
	panelClassName?: string;
}

/**
 * Modal — generic accessible dialog base.
 * - Closes on Escape key or backdrop click.
 * - Traps focus inside while open.
 * - Locks body scroll while open.
 */
export const Modal = ({
	isOpen,
	onClose,
	ariaLabel,
	children,
	panelClassName = '',
}: ModalProps) => {
	const panelRef = useRef<HTMLDivElement>(null);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [isOpen, onClose]);

	// Lock body scroll
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	// Focus the panel when it opens so Escape is captured and screen readers announce the dialog
	useEffect(() => {
		if (isOpen) {
			panelRef.current?.focus();
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		// Backdrop
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
			onClick={onClose}
		>
			/{/* Panel — stop click propagation so clicking inside doesn't close */}
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabel}
				tabIndex={-1}
				className={cn(
					'relative bg-surface rounded-xl shadow-2xl outline-none flex flex-col',
					panelClassName
				)}
				onClick={(e) => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
};
