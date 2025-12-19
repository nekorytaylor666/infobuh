import { createFileRoute } from "@tanstack/react-router";
import "../landing/index.css";

import Header from "@/components/landing/Header";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import { getNicheConfig } from "@/services/landing/niches";
import NicheBenefits from "@/components/landing/BusinessWhyLabel";
import BusinessHero from "@/components/landing/BusinessHero";
import DealsBusinessShowcase from "@/components/landing/BusinessFetures";
import StartNow from "@/components/landing/CallToAction";

export const Route = createFileRoute("/businesses/$businessId")({
	component: BusinessLanding,
});

function BusinessLanding() {
	const { businessId } = Route.useParams();
	const niche = getNicheConfig(businessId);

	return (
		<div className="landing-container">
			<Header forceLight />

			<BusinessHero
				kicker={niche.heroKicker}
				title={niche.heroTitle}
				subtitle={niche.heroText}
			/>

			<NicheBenefits {...niche.whyBlock} />

			{niche.dealsBlocks?.map((block, idx) => (
				<DealsBusinessShowcase
					key={idx}
					headerLabel={block.headerLabel}
					headerTitle={block.headerTitle}
					groups={block.groups}
				/>
			))}

			<StartNow />

			<Pricing />
			<Footer />
		</div>
	);
}
