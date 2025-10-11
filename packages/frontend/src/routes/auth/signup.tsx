import { useState } from "react";
import { authService } from "../../services/auth";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";
import { SignupForm } from "@/components/signup-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/auth/signup")({
	component: SignUpPage,
});

function SignUpPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validate password match
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		// Validate password length
		if (password.length < 8) {
			setError("Password must be at least 8 characters long");
			return;
		}

		setLoading(true);

		try {
			await authService.signUp(email, password);
			navigate({ to: "/auth/login" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to sign up");
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
						<CardTitle>Создать аккаунт</CardTitle>
						<CardDescription>
							Введите ваш email для создания аккаунта
						</CardDescription>
					</CardHeader>
					<CardContent>
						<SignupForm
							name={name}
							email={email}
							password={password}
							confirmPassword={confirmPassword}
							loading={loading}
							error={error}
							onNameChange={setName}
							onEmailChange={setEmail}
							onPasswordChange={setPassword}
							onConfirmPasswordChange={setConfirmPassword}
							onSubmit={handleSubmit}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
