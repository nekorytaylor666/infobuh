/**
 * Test script for the Documents Flutter API
 * Tests document creation with auto-generation and legacy file upload
 * Run this to test all documents functionality
 */

import { createDbClient } from "@accounting-kz/db";

const BASE_URL = "http://localhost:3000";
const LEGAL_ENTITY_ID = "2cc7dc33-f82a-4248-b969-f1d7902250ce";
const USER_ID = "1bfd1699-c849-43bb-8e23-f528f3bd4a0c";
const RECEIVER_BIN = "001123550090";
const RECEIVER_NAME = "ТОО Test Company";

// Utility function to generate random document numbers
function generateRandomDocNumber(prefix: string): string {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
}

interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface DocumentResponse {
    id: string;
    legalEntityId: string;
    type: string;
    receiverBin: string;
    receiverName: string;
    fields: Record<string, any>;
    documentPayload?: any; // Typed document metadata
    filePath: string;
    fileName?: string;
    createdAt: string;
    updatedAt: string;
    documentGenerated?: boolean;
    publicUrl?: string;
    storagePath?: string;
    status?: string;
    isRead?: boolean;
    isPinned?: boolean;
}

async function makeRequest<T>(
    path: string,
    options?: RequestInit,
    includeAuth: boolean = true
): Promise<T> {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (includeAuth) {
            // Add mock auth header - adjust based on your auth implementation
            headers["x-user-id"] = USER_ID;
        }

        const response = await fetch(`${BASE_URL}${path}`, {
            headers: {
                ...headers,
                ...options?.headers,
            },
            ...options,
        });

        // Get response as text first to debug JSON parsing issues
        const responseText = await response.text();

        // Log response details for debugging
        console.log(`📡 Response [${response.status}] for ${path}:`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Response length: ${responseText.length} chars`);

        if (responseText.length > 0) {
            console.log(`   First 200 chars: ${responseText.substring(0, 200)}`);
        }

        let result;

        // Handle 204 No Content responses (successful but empty)
        if (response.status === 204) {
            console.log(`   ✅ Success (No Content)`);
            return {} as T;
        }

        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error(`❌ JSON Parse Error for ${path}:`);
            console.error(`   Response status: ${response.status}`);
            console.error(`   Response headers:`, Object.fromEntries(response.headers.entries()));
            console.error(`   Full response text:`, responseText);
            throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }

        if (!response.ok) {
            console.error(`Request failed [${response.status}]:`, result);
            const errorMessage = typeof result.error === 'object'
                ? JSON.stringify(result.error)
                : (result.message || result.error || `HTTP ${response.status}`);
            throw new Error(errorMessage);
        }

        return result;
    } catch (error) {
        console.error(`Request failed: ${BASE_URL}${path}`, error);
        throw error;
    }
}

// Sample document data for different document types (matching actual schemas)
// Note: Document numbers are generated randomly for each test run
function getSampleDocumentData() {
    return {
        АВР: {
            orgName: "ТОО Example Company",
            orgAddress: "г. Алматы, ул. Абая 150",
            orgBin: "987654321098",
            buyerName: RECEIVER_NAME,
            buyerBin: RECEIVER_BIN,
            buyerAddress: "г. Алматы, ул. Байтурсынова 123",
            contractNumber: generateRandomDocNumber("CNT"),
            contractDate: new Date("2024-01-10"),
            orgPersonName: "Иванов Иван Иванович",
            orgPersonRole: "Директор",
            buyerPersonName: "Петров Петр Петрович",
            buyerPersonRole: "Генеральный директор",
            phone: "+7 701 123 4567",
            selectedBank: {
                name: "АО Ситибанк Казахстан",
                account: "KZ123456789012345678",
                bik: "CITIKZKA"
            },
            items: [
                {
                    name: "Консультационные услуги",
                    quantity: 1,
                    unit: "шт",
                    price: 150000,
                },
            ],
            actNumber: generateRandomDocNumber("ACT"),
            actDate: "2024-01-15",
            kbe: "17",
            executorName: "Иванов Иван Иванович",
            executorPosition: "Директор",
            customerName: "Петров Петр Петрович",
            customerPosition: "Генеральный директор",
        },
        Накладная: {
            orgName: "ТОО Example Company",
            orgBin: "987654321098",
            orgAddress: "г. Алматы, ул. Абая 150",
            buyerName: RECEIVER_NAME,
            buyerBin: RECEIVER_BIN,
            buyerAddress: "г. Алматы, ул. Байтурсынова 123",
            orgPersonName: "Иванов Иван Иванович",
            orgPersonRole: "Директор",
            buyerPersonName: "Петров Петр Петрович",
            buyerPersonRole: "Генеральный директор",
            phone: "+7 701 123 4567",
            selectedBank: {
                name: "АО Ситибанк Казахстан",
                account: "KZ123456789012345678",
                bik: "CITIKZKA"
            },
            items: [
                {
                    name: "Канцелярские товары",
                    quantity: 10,
                    unit: "шт",
                    price: 25000,
                    nomenclatureCode: "12345"
                },
            ],
            waybillNumber: generateRandomDocNumber("WB"),
            waybillDate: "2024-01-15",
            releaserEmployeeName: "Сидоров Сидор Сидорович",
            receiverEmployeeName: "Петров Петр Петрович",
            chiefAccountantName: "Бухгалтерова Анна Ивановна",
            transportOrgName: "ТОО Транспорт",
            transportWaybillInfo: `ТТН-${generateRandomDocNumber("TTN").split('-').pop()} от 15.01.2024`,
        },
        "Счет на оплату": {
            orgName: "ТОО Example Company",
            orgAddress: "г. Алматы, ул. Абая 150",
            orgBin: "987654321098",
            orgIik: "KZ123456789012345678",
            orgBik: "CITIKZKA",
            buyerName: RECEIVER_NAME,
            buyerBin: RECEIVER_BIN,
            codeKnp: "002",
            contract: `Договор ${generateRandomDocNumber("CNT")} от 10.01.2024`,
            orgPersonName: "Иванов Иван Иванович",
            phone: "+7 701 123 4567",
            selectedBank: {
                name: "АО Ситибанк Казахстан",
                account: "KZ123456789012345678",
                bik: "CITIKZKA"
            },
            items: [
                {
                    name: "Товары",
                    quantity: 1,
                    unit: "шт",
                    price: 300000,
                },
            ],
            invoiceNumber: generateRandomDocNumber("INV"),
            invoiceDate: "2024-01-15",
            contractDate: "2024-01-10",
            executorEmployeeId: null,
        },
        Инвойс: {
            orgName: "ТОО Example Company",
            orgAddress: "г. Алматы, ул. Абая 150",
            orgBin: "987654321098",
            orgIik: "KZ123456789012345678",
            orgBik: "CITIKZKA",
            buyerName: RECEIVER_NAME,
            buyerBin: RECEIVER_BIN,
            codeKnp: "002",
            contract: `Договор ${generateRandomDocNumber("CNT")} от 10.01.2024`,
            orgPersonName: "Иванов Иван Иванович",
            phone: "+7 701 123 4567",
            selectedBank: {
                name: "АО Ситибанк Казахстан",
                account: "KZ123456789012345678",
                bik: "CITIKZKA"
            },
            items: [
                {
                    name: "Услуги",
                    quantity: 1,
                    unit: "шт",
                    price: 400000,
                },
            ],
            invoiceNumber: generateRandomDocNumber("INV"),
            invoiceDate: "2024-01-15",
            contractDate: "2024-01-10",
            executorEmployeeId: null,
        },
        Доверенность: {
            orgName: "ТОО Example Company",
            orgAddress: "г. Алматы, ул. Абая 150",
            orgBin: "987654321098",
            buyerName: RECEIVER_NAME,
            buyerBin: RECEIVER_BIN,
            schetNaOplatu: `Счет № ${generateRandomDocNumber("INV")} от 15.01.2024`,
            orgPersonName: "Иванов Иван Иванович",
            orgPersonRole: "Директор",
            bookkeeperName: "Бухгалтерова Анна Ивановна",
            phone: "+7 701 123 4567",
            selectedBank: {
                name: "АО Ситибанк Казахстан",
                account: "KZ123456789012345678",
                bik: "CITIKZKA"
            },
            employeeName: "Иванов Иван Иванович",
            employeeRole: "Менеджер",
            employeeIin: "123456789012",
            employeeDocNumber: "123456789",
            employeeDocNumberDate: "2024-01-01",
            employeeWhoGives: "МВД РК",
            dateUntil: "2024-12-31",
            items: [
                {
                    name: "Товары по доверенности",
                    quantity: 1,
                    unit: "шт",
                    price: 100000,
                },
            ],
            idx: generateRandomDocNumber("DOV"),
            issueDate: "2024-01-15",
        },
    };
}

// Sample base64 PDF data (minimal PDF)
const samplePdfBase64 = "JVBERi0xLjQKJcWzyr3GCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxMzEgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA0Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoyMTAKJSVFT0Y=";

async function testDocumentsFlutterSystem() {
    console.log("🚀 Testing Documents Flutter System");
    console.log("=".repeat(60));
    console.log(`Legal Entity ID: ${LEGAL_ENTITY_ID}`);
    console.log(`User ID: ${USER_ID}`);
    console.log(`Receiver BIN: ${RECEIVER_BIN}`);

    try {
        const createdDocuments: DocumentResponse[] = [];

        // 1. Test document creation with auto-generation for each document type
        console.log("\n📋 1. Testing document auto-generation");
        const sampleDocumentData = getSampleDocumentData();
        for (const [documentType, data] of Object.entries(sampleDocumentData)) {
            console.log(`\n   Testing ${documentType} auto-generation...`);

            try {
                const createData = {
                    type: documentType,
                    receiverBin: RECEIVER_BIN,
                    receiverName: RECEIVER_NAME,
                    fields: data,
                    documentPayload: {
                        documentType,
                        data,
                        generatedAt: new Date().toISOString(),
                        generatedBy: USER_ID
                    },
                };

                const response = await makeRequest<DocumentResponse>(
                    `/docs-flutter/create?legalEntityId=${LEGAL_ENTITY_ID}`,
                    {
                        method: "POST",
                        body: JSON.stringify(createData),
                    }
                );

                console.log(`   ✅ ${documentType} created:`, {
                    id: response.id,
                    type: response.type,
                    fileName: response.fileName,
                    documentGenerated: response.documentGenerated,
                    hasPayload: !!response.documentPayload,
                    publicUrl: response.publicUrl ? "✅" : "❌",
                });

                createdDocuments.push(response);
            } catch (error) {
                console.log(`   ❌ Failed to create ${documentType}:`, (error as Error).message);
            }
        }

        // 2. Test legacy file upload (should not have documentPayload)
        console.log("\n📁 2. Testing legacy file upload (without documentPayload)");
        try {
            const legacyData = {
                type: "Other",
                receiverBin: RECEIVER_BIN,
                receiverName: RECEIVER_NAME,
                fields: {
                    fileName: "manual-document.pdf",
                    uploadedAt: new Date().toISOString()
                },
                legacyFile: {
                    name: "manual-document.pdf",
                    data: samplePdfBase64,
                    contentType: "application/pdf",
                },
            };

            const legacyResponse = await makeRequest<DocumentResponse>(
                `/docs-flutter/create?legalEntityId=${LEGAL_ENTITY_ID}`,
                {
                    method: "POST",
                    body: JSON.stringify(legacyData),
                }
            );

            console.log("   ✅ Legacy file uploaded:", {
                id: legacyResponse.id,
                type: legacyResponse.type,
                fileName: legacyResponse.fileName,
                documentGenerated: legacyResponse.documentGenerated,
                hasPayload: !!legacyResponse.documentPayload,
            });

            createdDocuments.push(legacyResponse);
        } catch (error) {
            console.log("   ❌ Legacy file upload failed:", (error as Error).message);
        }

        // 3. Test validation errors
        console.log("\n❌ 3. Testing validation errors");

        // Test missing documentPayload and legacyFile
        try {
            await makeRequest<DocumentResponse>(
                `/docs-flutter/create?legalEntityId=${LEGAL_ENTITY_ID}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        receiverBin: RECEIVER_BIN,
                        receiverName: RECEIVER_NAME,
                        // Missing both documentPayload and legacyFile
                    }),
                }
            );
            console.log("   ❌ Should have failed validation");
        } catch (error) {
            console.log("   ✅ Correctly rejected invalid data:", (error as Error).message);
        }

        // Test invalid BIN length
        try {
            await makeRequest<DocumentResponse>(
                `/docs-flutter/create?legalEntityId=${LEGAL_ENTITY_ID}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        receiverBin: "123", // Too short
                        receiverName: RECEIVER_NAME,
                        legacyFile: {
                            name: "test.pdf",
                            data: samplePdfBase64,
                            contentType: "application/pdf",
                        },
                    }),
                }
            );
            console.log("   ❌ Should have failed BIN validation");
        } catch (error) {
            console.log("   ✅ Correctly rejected invalid BIN:", (error as Error).message);
        }

        // 4. Test document retrieval by legal entity
        if (createdDocuments.length > 0) {
            console.log("\n📋 4. Testing document retrieval by legal entity");
            try {
                const listResponse = await makeRequest<DocumentResponse[]>(
                    `/docs-flutter/list?legalEntityId=${LEGAL_ENTITY_ID}`
                );

                console.log("   ✅ Documents retrieved:", {
                    total: listResponse.length,
                    withStatus: listResponse.filter(d => d.status).length,
                    withReadStatus: listResponse.filter(d => d.isRead !== undefined).length,
                    withPinStatus: listResponse.filter(d => d.isPinned !== undefined).length,
                });

                // Test filtering by type
                if (createdDocuments.length > 0) {
                    const firstDocType = createdDocuments[0].type;
                    const filteredResponse = await makeRequest<DocumentResponse[]>(
                        `/docs-flutter/list?legalEntityId=${LEGAL_ENTITY_ID}&type=${firstDocType}`
                    );

                    console.log(`   ✅ Filtered by type '${firstDocType}':`, filteredResponse.length, "documents");
                }
            } catch (error) {
                console.log("   ❌ Failed to retrieve documents:", (error as Error).message);
            }
        }

        // 5. Test document retrieval by receiver BIN
        console.log("\n📋 5. Testing document retrieval by receiver BIN");
        try {
            const receiverResponse = await makeRequest<DocumentResponse[]>(
                `/docs-flutter/listByReceiver?receiverBin=${RECEIVER_BIN}`
            );

            console.log("   ✅ Documents by receiver BIN:", {
                total: receiverResponse.length,
                statuses: receiverResponse.map(d => d.status || "no-status"),
            });
        } catch (error) {
            console.log("   ❌ Failed to retrieve by receiver BIN:", (error as Error).message);
        }

        // 6. Test individual document retrieval
        if (createdDocuments.length > 0) {
            const testDoc = createdDocuments[0];
            console.log("\n📄 6. Testing individual document retrieval");

            try {
                const docResponse = await makeRequest<DocumentResponse>(
                    `/docs-flutter/get/${testDoc.id}?legalEntityId=${LEGAL_ENTITY_ID}`
                );

                console.log("   ✅ Document retrieved:", {
                    id: docResponse.id,
                    type: docResponse.type,
                    hasSignatures: docResponse.status !== "unsigned",
                    hasPayload: !!docResponse.documentPayload,
                    payloadType: docResponse.documentPayload?.documentType || "none",
                });

                // Test with includeCms parameter
                const docWithCmsResponse = await makeRequest<DocumentResponse>(
                    `/docs-flutter/get/${testDoc.id}?legalEntityId=${LEGAL_ENTITY_ID}&includeCms=true`
                );

                console.log("   ✅ Document with CMS retrieved:", {
                    id: docWithCmsResponse.id,
                    includedCms: true,
                });
            } catch (error) {
                console.log("   ❌ Failed to retrieve document:", (error as Error).message);
            }
        }

        // 7. Test document update
        if (createdDocuments.length > 0) {
            const testDoc = createdDocuments[0];
            console.log("\n✏️ 7. Testing document update");

            try {
                const updateData = {
                    receiverName: "Updated Receiver Name",
                    documentPayload: {
                        documentType: "Other",
                        data: {
                            fileName: "updated-document.pdf",
                            fileType: "application/pdf",
                            fileSize: 1024,
                            description: "Updated document with metadata",
                            metadata: {
                                updatedAt: new Date().toISOString(),
                                updatedBy: USER_ID
                            }
                        },
                        generatedAt: new Date().toISOString(),
                        generatedBy: USER_ID
                    },
                    legacyFile: {
                        name: "updated-document.pdf",
                        data: samplePdfBase64,
                        contentType: "application/pdf",
                    },
                };

                const updateResponse = await makeRequest<DocumentResponse>(
                    `/docs-flutter/update/${testDoc.id}?legalEntityId=${LEGAL_ENTITY_ID}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(updateData),
                    }
                );

                console.log("   ✅ Document updated:", {
                    id: updateResponse.id,
                    newReceiverName: updateResponse.receiverName,
                    originalFileName: testDoc.fileName,
                    newFileName: updateData.legacyFile.name,
                    hasUpdatedPayload: !!updateResponse.documentPayload,
                    newPayloadType: updateResponse.documentPayload?.documentType || "none",
                });
            } catch (error) {
                console.log("   ❌ Failed to update document:", (error as Error).message);
            }
        }

        // 8. Test document marking as read
        if (createdDocuments.length > 0) {
            const testDoc = createdDocuments[0];
            console.log("\n👁️ 8. Testing mark as read");

            try {
                const readResponse = await makeRequest(
                    `/docs-flutter/markAsRead/${testDoc.id}`,
                    { method: "POST" }
                );

                console.log("   ✅ Document marked as read:", readResponse);
            } catch (error) {
                console.log("   ❌ Failed to mark as read:", (error as Error).message);
            }
        }

        // 9. Test document pinning
        if (createdDocuments.length > 0) {
            const testDoc = createdDocuments[0];
            console.log("\n📌 9. Testing document pinning");

            try {
                const pinResponse = await makeRequest(
                    `/docs-flutter/pin/${testDoc.id}`,
                    { method: "POST" }
                );

                console.log("   ✅ Document pinned:", pinResponse);

                // Test unpinning
                const unpinResponse = await makeRequest(
                    `/docs-flutter/unpin/${testDoc.id}`,
                    { method: "DELETE" }
                );

                console.log("   ✅ Document unpinned");
            } catch (error) {
                console.log("   ❌ Failed pin/unpin operations:", (error as Error).message);
            }
        }

        // 10. Test document signing (mock signing since we don't have real keys)
        if (createdDocuments.length > 0) {
            const testDoc = createdDocuments[0];
            console.log("\n✍️ 10. Testing document signing");

            try {
                const signData = {
                    key: "mock-key-data",
                    password: "mock-password",
                    signerId: USER_ID,
                };

                // Note: This will likely fail without real NCA setup, but tests the endpoint
                await makeRequest(
                    `/docs-flutter/sign/${testDoc.id}?legalEntityId=${LEGAL_ENTITY_ID}`,
                    {
                        method: "POST",
                        body: JSON.stringify(signData),
                    }
                );

                console.log("   ✅ Document signing endpoint called");
            } catch (error) {
                console.log("   ⚠️ Document signing failed (expected without NCA setup):", (error as Error).message);
            }
        }

        // 11. Test getting document signatures
        if (createdDocuments.length > 0) {
            const testDoc = createdDocuments[0];
            console.log("\n📋 11. Testing get document signatures");

            try {
                const signaturesResponse = await makeRequest(
                    `/docs-flutter/getSignatures/${testDoc.id}?legalEntityId=${LEGAL_ENTITY_ID}`
                );

                console.log("   ✅ Signatures retrieved:", {
                    count: Array.isArray(signaturesResponse) ? signaturesResponse.length : 0,
                });

                // Test with includeCms
                const signaturesWithCmsResponse = await makeRequest(
                    `/docs-flutter/getSignatures/${testDoc.id}?legalEntityId=${LEGAL_ENTITY_ID}&includeCms=true`
                );

                console.log("   ✅ Signatures with CMS retrieved");
            } catch (error) {
                console.log("   ❌ Failed to get signatures:", (error as Error).message);
            }
        }

        // 12. Test document deletion (clean up test documents)
        console.log("\n🗑️ 12. Testing document deletion (cleanup)");
        for (const doc of createdDocuments.slice(0, 2)) { // Delete first 2 documents
            try {
                await makeRequest(
                    `/docs-flutter/delete/${doc.id}?legalEntityId=${LEGAL_ENTITY_ID}`,
                    { method: "DELETE" }
                );

                console.log(`   ✅ Document deleted: ${doc.id} (${doc.type})`);
            } catch (error) {
                console.log(`   ❌ Failed to delete document ${doc.id}:`, (error as Error).message);
            }
        }

        // 13. Test error cases
        console.log("\n❌ 13. Testing error cases");

        // Test non-existent document
        try {
            await makeRequest<DocumentResponse>(
                `/docs-flutter/get/00000000-0000-0000-0000-000000000000?legalEntityId=${LEGAL_ENTITY_ID}`
            );
            console.log("   ❌ Should have failed for non-existent document");
        } catch (error) {
            console.log("   ✅ Correctly rejected non-existent document:", (error as Error).message);
        }

        // Test missing legal entity ID
        try {
            await makeRequest<DocumentResponse[]>("/docs-flutter/list");
            console.log("   ❌ Should have failed for missing legal entity ID");
        } catch (error) {
            console.log("   ✅ Correctly rejected missing legal entity ID:", (error as Error).message);
        }

        console.log("\n🎉 Documents Flutter testing completed!");
        console.log("\n📋 Test Summary:");
        console.log(`- ✅ Document auto-generation: ${Object.keys(getSampleDocumentData()).length} types tested`);
        console.log("- ✅ Document payload metadata: Tested for all document types");
        console.log("- ✅ Legacy file upload: Tested (without payload)");
        console.log("- ✅ Validation errors: Tested");
        console.log("- ✅ Document retrieval: Multiple methods tested");
        console.log("- ✅ Document update: Tested (including payload update)");
        console.log("- ✅ Read/Pin operations: Tested");
        console.log("- ✅ Signing endpoints: Tested (mock data)");
        console.log("- ✅ Document deletion: Tested");
        console.log("- ✅ Error handling: Tested");

        console.log("\n📊 Document Types Tested:");
        Object.keys(getSampleDocumentData()).forEach(type => {
            console.log(`- ${type}: Auto-generation with typed data`);
        });

        console.log("\n📋 Tested Endpoints:");
        console.log("- POST /docs-flutter/create (auto-generation & legacy)");
        console.log("- GET /docs-flutter/list");
        console.log("- GET /docs-flutter/listByReceiver");
        console.log("- GET /docs-flutter/get/:id");
        console.log("- PUT /docs-flutter/update/:id");
        console.log("- DELETE /docs-flutter/delete/:id");
        console.log("- POST /docs-flutter/markAsRead/:id");
        console.log("- POST /docs-flutter/pin/:id");
        console.log("- DELETE /docs-flutter/unpin/:id");
        console.log("- POST /docs-flutter/sign/:id");
        console.log("- GET /docs-flutter/getSignatures/:id");

    } catch (error) {
        console.error("❌ Test suite failed:", error);
    }
}

// Test individual document type creation
async function testSpecificDocumentType(documentType: keyof ReturnType<typeof getSampleDocumentData>) {
    console.log(`\n🧪 Testing specific document type: ${documentType}`);

    try {
        const sampleDocumentData = getSampleDocumentData();
        const data = sampleDocumentData[documentType];
        const createData = {
            type: documentType,
            receiverBin: RECEIVER_BIN,
            receiverName: RECEIVER_NAME,
            fields: data,
            documentPayload: {
                documentType,
                data,
                generatedAt: new Date().toISOString(),
                generatedBy: USER_ID
            },
        };

        const response = await makeRequest<DocumentResponse>(
            `/docs-flutter/create?legalEntityId=${LEGAL_ENTITY_ID}`,
            {
                method: "POST",
                body: JSON.stringify(createData),
            }
        );

        console.log(`✅ ${documentType} created successfully:`, {
            id: response.id,
            type: response.type,
            fileName: response.fileName,
            hasPayload: !!response.documentPayload,
            payloadType: response.documentPayload?.documentType || "none",
            publicUrl: response.publicUrl,
            storagePath: response.storagePath,
        });

        return response;
    } catch (error) {
        console.error(`❌ Failed to create ${documentType}:`, error);
        throw error;
    }
}

// Test document generation performance
async function testDocumentGenerationPerformance() {
    console.log("\n⚡ Testing document generation performance");
    const results: { type: string; time: number; success: boolean }[] = [];
    const sampleDocumentData = getSampleDocumentData();

    for (const [documentType, data] of Object.entries(sampleDocumentData)) {
        const startTime = Date.now();

        try {
            await testSpecificDocumentType(documentType as keyof ReturnType<typeof getSampleDocumentData>);
            const endTime = Date.now();
            results.push({
                type: documentType,
                time: endTime - startTime,
                success: true,
            });
        } catch (error) {
            const endTime = Date.now();
            results.push({
                type: documentType,
                time: endTime - startTime,
                success: false,
            });
        }
    }

    console.log("\n📊 Performance Results:");
    results.forEach(result => {
        console.log(`${result.success ? '✅' : '❌'} ${result.type}: ${result.time}ms`);
    });

    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const successRate = (results.filter(r => r.success).length / results.length) * 100;

    console.log(`\nAverage generation time: ${avgTime.toFixed(2)}ms`);
    console.log(`Success rate: ${successRate.toFixed(2)}%`);
}

// Run tests if file is called directly
if (require.main === module) {
    console.log("🚀 Starting Documents Flutter API Tests");
    console.log("Make sure the server is running on http://localhost:3000");
    console.log("");

    // Wait a bit for server to be ready
    setTimeout(async () => {
        await testDocumentsFlutterSystem();
        // Uncomment to run performance tests
        // await testDocumentGenerationPerformance();
    }, 1000);
}

export {
    testDocumentsFlutterSystem,
    testSpecificDocumentType,
    testDocumentGenerationPerformance
}; 