import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const mediaQueryList = window.matchMedia(query);
		const documentChangeHandler = () => setMatches(mediaQueryList.matches);

		// Initial check
		documentChangeHandler();

		// Listen for changes
		mediaQueryList.addEventListener("change", documentChangeHandler);

		// Cleanup listener on component unmount
		return () => {
			mediaQueryList.removeEventListener("change", documentChangeHandler);
		};
	}, [query]);

	return matches;
}
