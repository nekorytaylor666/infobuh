import { useTheme } from "next-themes";
import logoLight from "../assets/logo-light.svg";
import logoDark from "../assets/logo.svg";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	className?: string;
}

export const Logo = ({ className, alt = "Logo", ...props }: LogoProps) => {
	const { resolvedTheme } = useTheme();

	return <img src={logoLight} alt={alt} className={className} {...props} />;
};
