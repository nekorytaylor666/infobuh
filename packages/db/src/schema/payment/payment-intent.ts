import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    uuid,
    pgEnum,
    jsonb,
} from "drizzle-orm/pg-core";
import { paymentOrder } from "./payment-order";
import { profile } from "../auth";
import { paymentWays } from "./paymen-ways";


export const gatewayEnum = pgEnum('gateway', ['kaspi', 'stripe']);
export const statusEnum = pgEnum('transtionStatus', ['waiting', 'success', 'cancel']);

export const paymentIntent = pgTable('payment_intent', {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id"),
    buyerId: uuid('buyer_id')
        .references(() => profile.id, { onDelete: 'cascade' }),
    paymentOrderId: uuid('payment_order_id')
        .references(() => paymentOrder.id, { onDelete: 'cascade' }),
    gateway: gatewayEnum().notNull(),
    status: statusEnum().notNull(),
    paymentWayId: uuid("payment_way_id")
        .references(() => paymentWays.id, { onDelete: 'cascade' }),
    jsonb: jsonb(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
})

export const transactionsRelations = relations(paymentIntent, ({ one, many }) => ({
    paymentOrder: one(paymentOrder, {
        fields: [paymentIntent.paymentOrderId],
        references: [paymentOrder.id],
    }),
    profile: one(profile, {
        fields: [paymentIntent.buyerId],
        references: [profile.id]
    }),
    paymentWays: one(paymentWays, {
        fields: [paymentIntent.paymentWayId],
        references: [paymentWays.id]
    })
}));