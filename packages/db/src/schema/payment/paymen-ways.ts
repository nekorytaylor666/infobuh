// возможные платежные решение 
import { relations } from "drizzle-orm";
import {
    pgTable,

    uuid,

} from "drizzle-orm/pg-core";
import { paymentIntent } from "./payment-intent";
import { profile } from "../auth";

export const paymentWays = pgTable('payment_ways', {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
        .references(() => profile.id, { onDelete: 'cascade' }),
});

export const paymentWayReleations = relations(paymentWays, ({ one, many }) => ({
    paymentIntent: many(paymentIntent),
    profile: one(profile, {
        fields: [paymentWays.profileId],
        references: [profile.id]
    })
}));