import { eq } from "drizzle-orm";
import { db } from "./db";
import { onboardingStatus } from "./db/schema";

const test = async () => {
	const status = await db.query.onboardingStatus.findFirst({
		where: eq(onboardingStatus.userId, "0551fc5c-d0f2-498a-bb96-d0d7ba7fd1fd"),
	});
	console.log(status);
};

test();
