

// async function runUgdTests() {
// 	console.log("Running UGD Service Tests...");

// 	const testCases = [
// 		{ input: "ЕСИЛЬ", expectedCode: "0318" }, // УГД по Есильскому району (Акмолинская область) OR 4806 (СКО)
// 		{ input: "г. Есиль", expectedCode: "0318" }, // Should normalize and find
// 		{ input: "Есильский район", expectedCode: "0318" }, // Should normalize and find
// 		{ input: "ГОРОД АСТАНА, РАЙОН ЕСИЛЬ", expectedCode: "6205" }, // УГД по Есильскому району (Астана)
// 		{ input: "Астана, Есиль", expectedCode: "6205" },
// 		{ input: "Астана", expectedCode: "6205" }, // More general, might pick Есильский, or Байконыр or Алматы р-н Астаны. Expecting 6205, 6202 or 6203 or 6207
// 		{ input: "НУР-СУЛТАН", expectedCode: "6205" }, // Similar to Астана
// 		{ input: "Алматы, Бостандыкский район", expectedCode: "6004" }, // УГД по Бостандыкскому району (Алматы)
// 		{ input: "Бостандыкский", expectedCode: "6004" },
// 		{ input: "г. Алматы", expectedCode: "6003" }, // First UGD for Almaty based on CSV order (Ауэзовский)
// 		{ input: "АЛМАТЫ", expectedCode: "6003" }, // Same as above
// 		{ input: "Сатпаев", expectedCode: "7206" }, // УГД по городу Сатпаеву
// 		{ input: "город Сатпаев", expectedCode: "7206" },
// 		{ input: "Семей", expectedCode: "7111" }, // УГД по городу Семею
// 		{ input: "г. Семей", expectedCode: "7111" },
// 		{ input: "АКТОБЕ", expectedCode: "0618" }, // УГД по г.Актобе
// 		{ input: "г.Актобе", expectedCode: "0618" },
// 		{ input: "Атырау", expectedCode: "1510" }, // УГД по г.Атырау
// 		{ input: "Павлодар", expectedCode: "4515" }, // УГД по г.Павлодар
// 		{ input: "Шымкент, Абайский район", expectedCode: "5904" }, // УГД по Абайскому району (Шымкент)
// 		{ input: "Шымкент", expectedCode: "5903" }, // УГД по Аль-Фарабийскому району (первый для Шымкента в CSV)
// 		{ input: "Несуществующий Город", expectedCode: null },
// 		{ input: "район Казыбек би", expectedCode: "3020" }, // УГД по району имени Казыбек би (Караганда)
// 		{ input: "Казыбек би", expectedCode: "3020" },
// 		{ input: "Морпорт Актау", expectedCode: "4309" }, // УГД "Морпорт Актау"
// 		{ input: "Астана-жаңа қала", expectedCode: "6206" }, // УГД "Астана-жаңа қала"
// 		// Edge cases for normalization or multiple parts
// 		{ input: "  г. Астана  , район Есиль.  ", expectedCode: "6205" }, // Test trimming and splitting
// 		{ input: "Алматы и Бостандыкский", expectedCode: "6004" }, // Test splitting with "и"
// 		{ input: "FakeCity, Есиль (Астана)", expectedCode: "6205" }, // Test first valid part matching
// 		{ input: "Есиль (Акмолинская), ДругойРайон", expectedCode: "0318" },
// 	];

// 	for (const { input, expectedCode } of testCases) {
// 		const result = await findUgdByAddressComponents({ localityName: input });
// 		if (result?.code === expectedCode) {
// 			console.log(
// 				`✅ PASSED: Input: "${input}" -> Expected: ${expectedCode}, Got: ${result?.code} (Name: ${result?.name})`,
// 			);
// 		} else {
// 			console.error(
// 				`❌ FAILED: Input: "${input}" -> Expected: ${expectedCode}, Got: ${result?.code} (Name: ${result?.name})`,
// 			);
// 		}
// 	}
// }
//
// runUgdTests();
