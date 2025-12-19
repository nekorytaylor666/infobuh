import { createFileRoute, useNavigate } from "@tanstack/react-router";
import "../landing/index.css";
import { niches } from "@/services/landing/niches";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export const Route = createFileRoute("/businesses/")({
	component: Niches,
});

function Niches() {
	const navigate = useNavigate();

	const items = Object.values(niches).filter((niche) => niche.id !== "default");

	return (
		<div className="landing-container businesses-list">
			<div className="businesses-list-inner">
				<Header forceLight />
				<div className="businesses-title">Выберите вашу нишу бизнеса</div>

				<div className="businesses-grid">
					{items.map((niche) => (
						<div
							key={niche.id}
							className="business-card"
							onClick={() => navigate({ to: `/businesses/${niche.id}` })}
						>
							<div className="business-card-content">
								<div className="business-card-kicker">{niche.heroKicker}</div>
								<div className="business-card-title">{niche.heroTitle}</div>
								<div className="business-card-text">{niche.heroText}</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<Footer />
		</div>
	);
}
