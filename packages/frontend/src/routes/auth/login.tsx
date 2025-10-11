import { useState } from "react";
import { authService } from "../../services/auth";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import {
	Card,
	CardContent,
	CardTitle,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";
export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
	validateSearch: (search) => {
		return {
			returnTo: search.returnTo as string,
		};
	},
});

function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { returnTo } = useSearch({ from: "/auth/login" });

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await authService.signIn(email, password);
			navigate({ to: returnTo || "/" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to sign in");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<a href="#" className="flex items-center gap-2 self-center font-medium">
					<div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
						<Logo className="size-4" />
					</div>
					<span className="text-lg font-semibold tracking-tighter text-gray-900 dark:text-gray-50">
						ИнфоБух
					</span>
				</a>
				<Card>
					<CardHeader>
						<CardTitle>Войти в аккаунт</CardTitle>
						<CardDescription>
							Введите ваш email для входа в систему
						</CardDescription>
					</CardHeader>
					<CardContent>
						<LoginForm
							email={email}
							password={password}
							loading={loading}
							error={error}
							onEmailChange={setEmail}
							onPasswordChange={setPassword}
							onSubmit={handleSubmit}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
