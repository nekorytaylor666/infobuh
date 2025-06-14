import { createKazakhActService } from "./kazakh-acts";
import { createKazakhWaybillService } from "./kazakh-waybill";
import { createKazakhInvoiceService } from "./kazakh-invoice";
import { createKazakhDoverennostService } from "./kazakh-doverennost";

export * from "./kazakh-invoice";
export * from "./kazakh-acts";
export * from "./kazakh-waybill";
export * from "./kazakh-doverennost";

export const createDocumentGenerator = () => {
  const documentGenerator = {
    generateInvoice: createKazakhInvoiceService(),
    generateAct: createKazakhActService(),
    generateWaybill: createKazakhWaybillService(),
    generateDoverennost: createKazakhDoverennostService(),
  };
  const generate = <T extends keyof typeof documentGenerator>(
    templateType: T,
    input: Parameters<(typeof documentGenerator)[T]["generateDocument"]>[0],
  ) => {
    const generator =
      documentGenerator[templateType as keyof typeof documentGenerator];
    const parsedInput = generator.parseInput(input);
    return generator.generateDocument(parsedInput as any);
  };

  const parseInput = <T extends keyof typeof documentGenerator>(
    templateType: T,
    input: Parameters<(typeof documentGenerator)[T]["parseInput"]>[0],
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
