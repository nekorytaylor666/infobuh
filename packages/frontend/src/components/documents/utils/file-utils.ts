export function calculateFileSize(size: string): string {
	const sizeInBytes = Number.parseInt(size, 10);

	if (sizeInBytes < 1024) {
		return `${sizeInBytes} B`;
	}

	if (sizeInBytes < 1024 * 1024) {
		return `${(sizeInBytes / 1024).toFixed(2)} KB`;
	}

	if (sizeInBytes < 1024 * 1024 * 1024) {
		return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
