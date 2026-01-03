import { relations } from "drizzle-orm";
import {
    pgTable, timestamp, uuid, boolean, integer,
} from "drizzle-orm/pg-core";
import { profile } from "../auth";
import { paymentIntent } from "./payment-intent";
import { legalEntities } from "../legal-entities";
import { paymentProduct } from "./payment-product";


export const paymentOrder = pgTable('subscriptions', {
    id: uuid("id").primaryKey().defaultRandom(),
    renew: boolean('renew').default(true),
    legalEntityId: uuid('legalEntity')
        .references(() => profile.id, { onDelete: "cascade" }),
    buyerId: uuid("buyerId")
        .references(() => profile.id, { onDelete: "cascade" })
        .notNull(),
    profileId: uuid("profile_id")
        .references(() => profile.id, { onDelete: "cascade" })
        .notNull(),
    startTime: timestamp("startTime").notNull(),
    endTime: timestamp("endTime"),
    durationInSeconds: integer("duration_in_seconds").notNull(),
    paymentProductId: uuid('payment_product_id')
        .references(() => paymentProduct.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),

})

export const paymentOrderRelations = relations(
    paymentOrder, ({
        one, many
    }) => ({
        profile: one(profile, {
            fields: [paymentOrder.profileId],
            references: [profile.id]
        }),
        paymentProduct: one(paymentProduct, {
            fields: [paymentOrder.paymentProductId],
            references: [paymentProduct.id]
        }),
        paymentIntent: many(paymentIntent),
        buyer: one(profile, {
            fields: [paymentOrder.buyerId],
            references: [profile.id],
        }),
        legalEntity: one(
            legalEntities, {
            fields: [paymentOrder.legalEntityId],
            references: [legalEntities.id],
        })
    })
)