import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    uuid,
    boolean,
    doublePrecision,
    integer,
    pgEnum,
} from "drizzle-orm/pg-core";
import { paymentOrder } from "./payment-order";

const productAccessEnum = pgEnum('productAccess', [''])

export const paymentProduct = pgTable('payment_product', {
    id: uuid('id').primaryKey().defaultRandom(),
    price: doublePrecision('price').notNull(),
    label: text('label').notNull(),
    renew: boolean('renew').default(true),
    durationInSeconds: integer('duration_in_seconds'),
    accessCode: productAccessEnum().array().default([]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
})

export const paymentProductRelations = relations(paymentProduct,
    ({ one, many }) => ({
        paymentOrder: many(paymentOrder),
    })
)