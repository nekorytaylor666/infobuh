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

interface SignupFormProps
	extends Omit<React.ComponentProps<"form">, "onSubmit"> {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	loading?: boolean;
	error?: string;
	onNameChange: (name: string) => void;
	onEmailChange: (email: string) => void;
	onPasswordChange: (password: string) => void;
	onConfirmPasswordChange: (confirmPassword: string) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function SignupForm({
	className,
	name,
	email,
	password,
	confirmPassword,
	loading,
	error,
	onNameChange,
	onEmailChange,
	onPasswordChange,
	onConfirmPasswordChange,
	onSubmit,
	...props
}: SignupFormProps) {
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
					<FieldLabel htmlFor="name">Полное имя</FieldLabel>
					<Input
						id="name"
						type="text"
						placeholder="Иван Иванов"
						required
						value={name}
						onChange={(e) => onNameChange(e.target.value)}
						disabled={loading}
					/>
				</Field>
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
					<Field className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="password">Пароль</FieldLabel>
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
							<FieldLabel htmlFor="confirm-password">
								Подтвердите пароль
							</FieldLabel>
							<Input
								id="confirm-password"
								type="password"
								required
								value={confirmPassword}
								onChange={(e) => onConfirmPasswordChange(e.target.value)}
								disabled={loading}
							/>
						</Field>
					</Field>
					<FieldDescription>Минимум 8 символов.</FieldDescription>
				</Field>
				<Field>
					<Button type="submit" disabled={loading}>
						{loading ? "Создание аккаунта..." : "Создать аккаунт"}
					</Button>
					<FieldDescription className="text-center">
						Уже есть аккаунт?{" "}
						<Link to="/auth/login" className="underline underline-offset-4">
							Войти
						</Link>
					</FieldDescription>
				</Field>
			</FieldGroup>
		</form>
	);
}
