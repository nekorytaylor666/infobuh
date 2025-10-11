import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";

interface LoginFormProps
	extends Omit<React.ComponentProps<"form">, "onSubmit"> {
	email: string;
	password: string;
	loading?: boolean;
	error?: string;
	onEmailChange: (email: string) => void;
	onPasswordChange: (password: string) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
	className,
	email,
	password,
	loading,
	error,
	onEmailChange,
	onPasswordChange,
	onSubmit,
	...props
}: LoginFormProps) {
	return (
		<form
			className={cn("flex flex-col gap-6", className)}
			onSubmit={onSubmit}
			{...props}
		>
			<FieldGroup>
				{error && (
					<div className="text-destructive text-sm text-center p-2 bg-destructive/10 rounded-md">
						{error}
					</div>
				)}
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						id="email"
						type="email"
						placeholder="primer@example.com"
						required
						value={email}
						onChange={(e) => onEmailChange(e.target.value)}
						disabled={loading}
					/>
				</Field>
				<Field>
					<div className="flex items-center">
						<FieldLabel htmlFor="password">Пароль</FieldLabel>
						<a
							href="#"
							className="ml-auto text-sm underline-offset-4 hover:underline"
						>
							Забыли пароль?
						</a>
					</div>
					<Input
						id="password"
						type="password"
						required
						value={password}
						onChange={(e) => onPasswordChange(e.target.value)}
						disabled={loading}
					/>
				</Field>
				<Field>
					<Button type="submit" disabled={loading}>
						{loading ? "Вход..." : "Войти"}
					</Button>
				</Field>
				<FieldSeparator>Или продолжить с</FieldSeparator>
				<Field>
					<Button variant="outline" type="button" disabled={loading}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							className="size-5"
						>
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Войти через Google
					</Button>
					<FieldDescription className="text-center">
						Нет аккаунта?{" "}
						<Link to="/auth/signup" className="underline underline-offset-4">
							Зарегистрироваться
						</Link>
					</FieldDescription>
				</Field>
			</FieldGroup>
		</form>
	);
}
