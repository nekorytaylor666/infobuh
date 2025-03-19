import { createKazakhActService } from "./kazakh-acts";
import { KazakhActTemplate } from "./kazakh-acts/template";
import { createKazakhWaybillService } from "./kazakh-waybill";
import {
  createKazakhInvoiceService,
  KazakhInvoiceTemplate,
} from "./kazakh-invoice";
import { Database } from "../../../db";
import { db } from "../../../db"; // Import the actual db instance

export * from "./kazakh-invoice";
export * from "./kazakh-acts";

export const templateGenerators = {
  "kazakh-invoice": createKazakhInvoiceService,
  "kazakh-acts": createKazakhActService,
  "kazakh-waybill": createKazakhWaybillService,
};

export const createDocumentGenerator = (db: Database) => {
  const documentGenerator = {
    generateInvoice: createKazakhInvoiceService(db),
    generateAct: createKazakhActService(db),
    generateWaybill: createKazakhWaybillService(db),
  };
  const generate = <T extends keyof typeof documentGenerator>(
    templateType: T,
    input: Parameters<(typeof documentGenerator)[T]["generateDocument"]>[0]
  ) => {
    const generator = documentGenerator[templateType];
    const parsedInput = generator.parseInput(input);
    return generator.generateDocument(parsedInput);
  };

  const parseInput = <T extends keyof typeof documentGenerator>(
    templateType: T,
    input: Parameters<(typeof documentGenerator)[T]["parseInput"]>[0]
  ) => {
    const generator = documentGenerator[templateType];
    return generator.parseInput(input);
  };
  return {
    generate,
    parseInput,
  };
};

export const documentParser = (
  templateType: keyof typeof templateGenerators
) => {
  return templateGenerators[templateType](db).parseInput;
};

// Example usage - commented out until proper data is provided
// generate("generateAct", {
//   sellerLegalEntityId: "",
//   clientLegalEntityId: "",
//   contractNumber: "",
//   contractDate: "",
//   items: [],
//   actNumber: "",
//   actDate: "",
//   dateOfCompletion: ""
// });
