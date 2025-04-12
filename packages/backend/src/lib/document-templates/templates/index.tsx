import { createKazakhActService } from "./kazakh-acts";
import { createKazakhWaybillService } from "./kazakh-waybill";
import { createKazakhInvoiceService } from "./kazakh-invoice";
import type { Database } from "../../../db";

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
    const generator =
      documentGenerator[templateType as keyof typeof documentGenerator];
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
