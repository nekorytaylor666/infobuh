import { createFileRoute } from "@tanstack/react-router";
import "./landing/index.css";
import heroVideo from "@/assets/landing/hero.mp4";
import Header from "@/components/landing/Header";
import DealsShowcase from "@/components/landing/DealsShowcase";
import OtherFutures from "@/components/landing/OtherFutures";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import WhyInfobuh from "@/components/landing/Why";
import { redirectToStore } from "@/services/landing/redirectToStore";
import { getWhatsappLink } from "@/services/landing/whatsapp";

export const Route = createFileRoute("/")({
	component: MainLanding,
});

function MainLanding() {
	return (
		<div className="landing-container">
			<Header />
			<div className="hero-video">
				<video
					className="hero-video-bg"
					src={heroVideo}
					autoPlay
					muted
					loop
					playsInline
				/>

				<div className="hero-video-overlay" />

				<div className="hero-video-content">
					<h1 className="hero-title">
						Простая бухгалтерия для казахстанских бизнесов
					</h1>

					<div className="hero-buttons">
						<button className="hero-btn-outline" onClick={redirectToStore}>
							Начать
						</button>
						<button className="hero-btn-filled" onClick={getWhatsappLink}>
							Связаться
						</button>
					</div>
				</div>
			</div>

			<div className="second">
				<div className="second-text" style={{ fontSize: 13 }}>
					ДОКУМЕНТООБОРОТ
				</div>
				<div className="second-title">Лучшее ЭДО решение</div>
				<div className="second-text">
					Счет, акт, накладная, договор, ЭЦП подписи и все проводки — в одном
					окне.
					<br /> Создаете, отправляете, подписываете и сразу видите оплату.
				</div>
			</div>

			<DealsShowcase />
			<OtherFutures />
			<WhyInfobuh
				title={"Infobuh нужен не только бухгалтеру. Он нужен и владельцу бизнеса."}
			/>
			<Pricing />
			<Footer />
		</div>
	);
}
