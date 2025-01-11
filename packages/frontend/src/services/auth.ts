import { supabase } from "../lib/supabase";

export const authService = {
	async signUp(email: string, password: string) {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});
		if (error) throw error;
		return data;
	},
	async isAuthenticated() {
		const { data, error } = await supabase.auth.getSession();
		if (error) throw error;
		return data.sessio;
	},

	async signIn(email: string, password: string) {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) throw error;
		return data;
	},

	async signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	},

	async getSession() {
		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();
		if (error) throw error;
		return session;
	},

	onAuthStateChange(
		callback: (event: "SIGNED_IN" | "SIGNED_OUT", session: any) => void,
	) {
		return supabase.auth.onAuthStateChange((event, session) => {
			callback(event as "SIGNED_IN" | "SIGNED_OUT", session);
		});
	},
};
