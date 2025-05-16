import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import type { OnboardingData } from "./schema";
import { api } from "@/lib/api";

const signatureSchema = z.object({
  signatureFile: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, "Требуется файл ЭЦП.")
    .refine(
      (files) => files?.[0]?.name.endsWith(".p12"),
      "Файл должен быть в формате .p12"
    ),
  password: z.string().min(1, "Требуется пароль."),
});

type SignatureFormData = z.infer<typeof signatureSchema>;

// Basic types for NCANode response based on provided sample and common structure
interface NCANodeSubject {
  commonName?: string;
  surName?: string;
  iin?: string;
  bin?: string; // For legal entities
  country?: string;
  dn?: string;
  // Add other relevant fields from subject if needed
}

interface SignerInfo {
  valid: boolean;
  notBefore: string;
  notAfter: string;
  keyUsage: string;
  serialNumber: string;
  subject: NCANodeSubject;
  // Add other relevant fields from signer object if needed
}

interface NCANodeInfoResponse {
  status?: number; // Optional as per user's initial result shape, though typically present
  message?: string; // Optional
  valid?: boolean; // Top-level validity, if present
  signers?: SignerInfo[];
  // NCANode can also return error structure directly, e.g. { status, message }
}

// Type for response from /api/legal-entity/verify-bin (based on BinRegistryEntry)
interface BinRegistryData {
  id: string;
  bin: string;
  fullNameKz?: string | null;
  fullNameRu?: string | null;
  registrationDate?: string | null; // Assuming date comes as YYYY-MM-DD string
  oked?: string | null;
  primaryActivityKz?: string | null;
  primaryActivityRu?: string | null;
  secondaryOked?: string | null;
  krp?: string | null;
  krpNameKz?: string | null;
  krpNameRu?: string | null;
  kse?: string | null;
  kseNameKz?: string | null;
  kseNameRu?: string | null;
  kfs?: string | null;
  kfsNameKz?: string | null;
  kfsNameRu?: string | null;
  kato?: string | null;
  localityNameKz?: string | null;
  localityNameRu?: string | null;
  legalAddress?: string | null;
  directorName?: string | null;
  createdAt: string;
  updatedAt: string;
  ugdCode?: string | null;
  ugdName?: string | null;
}

interface SignatureFormProps {
  onSuccess: () => void;
}

// Helper function to parse specific field from DN string
function parseDnForField(
  dnStr: string | undefined | null,
  targetKey: string
): string | null {
  if (!dnStr) return null;
  const parts = dnStr.match(/(\.|[^,])+/g) || [];
  for (const part of parts) {
    const firstEqualSign = part.indexOf("=");
    if (firstEqualSign > 0) {
      const key = part.substring(0, firstEqualSign).trim().toUpperCase();
      if (key === targetKey.toUpperCase()) {
        let value = part.substring(firstEqualSign + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value
            .substring(1, value.length - 1)
            .replace(/\"/g, '"')
            .replace(/\\/g, "\\");
        }
        return value;
      }
    }
  }
  return null;
}

export function SignatureForm({ onSuccess }: SignatureFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignatureFormData>({
    resolver: zodResolver(signatureSchema),
  });

  const { setValue } = useFormContext<OnboardingData>();

  const processSignature = async (formData: SignatureFormData) => {
    const { signatureFile, password } = formData;
    const file = signatureFile[0];

    try {
      const fileBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(fileBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Key = btoa(binary);

      const ncaNodeUrl = "https://signer.infobuh.com/pkcs12/info";

      const response = await fetch(ncaNodeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keys: [
            {
              key: base64Key,
              password: password,
            },
          ],
        }),
      });

      let result: NCANodeInfoResponse;
      try {
        result = await response.json();
      } catch (e) {
        console.error("NCANode API response parse error:", e);
        toast.error(
          `Ошибка связи с сервером ЭЦП: ${response.statusText || "Не удалось получить ответ"}`
        );
        return;
      }

      console.log("NCANode response:", result);

      if (!response.ok || (result.status && result.status !== 200)) {
        console.error("NCANode API error:", result);
        toast.error(
          `Ошибка ЭЦП: ${result.message || "Неизвестная ошибка от сервера ЭЦП"}`
        );
        return;
      }

      if (result.signers && result.signers.length > 0) {
        const signerInfo = result.signers[0];
        const subject = signerInfo.subject;

        if (subject) {
          const organizationNameFromDn = parseDnForField(subject.dn, "O");
          const binFromSubject = subject.bin; // This will be undefined for individual certs
          const iinFromSubject = subject.iin; // This will be present for individual certs

          let dataLoaded = false;
          if (organizationNameFromDn) {
            setValue("legalEntity.name", organizationNameFromDn);
            dataLoaded = true;
          }
          if (binFromSubject || iinFromSubject) {
            setValue("legalEntity.bin", binFromSubject || iinFromSubject);
            dataLoaded = true;

            // Now, verify BIN and get more details
            try {
              const bin = binFromSubject || iinFromSubject;
              const verifyBinUrl = `/legal-entity/verify-bin?q=${bin}`;
              const binRegistryResponse = await api.get(verifyBinUrl);
              console.log("BIN Registry response:", binRegistryResponse);

              if (binRegistryResponse.status !== 200) {
                const errorData = binRegistryResponse.data;
                toast.error(
                  `Ошибка при проверке БИН ${binFromSubject}: ${errorData?.error || binRegistryResponse.statusText}`
                );
                // Proceed with EDS data if any
              } else {
                const registryData: BinRegistryData = binRegistryResponse.data;

                console.log(
                  "BIN Registry response:",
                  registryData,
                  registryData.legalAddress,
                  registryData.localityNameRu
                );

                let registryDataApplied = false;
                if (registryData.fullNameRu) {
                  setValue("legalEntity.name", registryData.fullNameRu);
                  const name = registryData.fullNameRu;
                  const type = name.split(" ")[0];
                  console.log("type", type);
                  if (type === "Товарищество") {
                    setValue(
                      "legalEntity.type",
                      "Товарищество с ограниченной ответственностью"
                    );
                  } else if (type === "Акционерное") {
                    setValue("legalEntity.type", "Акционерное общество");
                  } else if (type === "ИП") {
                    setValue(
                      "legalEntity.type",
                      "Индивидуальный предприниматель"
                    );
                  } else {
                    setValue("legalEntity.type", registryData.kseNameRu);
                  }

                  registryDataApplied = true;
                } else if (registryData.fullNameKz) {
                  setValue("legalEntity.name", registryData.fullNameKz);
                  registryDataApplied = true;
                }

                if (registryData.oked) {
                  setValue("legalEntity.oked", registryData.oked);
                  registryDataApplied = true;
                }
                if (registryData.legalAddress || registryData.localityNameRu) {
                  const address =
                    registryData.legalAddress || registryData.localityNameRu;
                  if (address) {
                    console.log(
                      "address",
                      registryData.legalAddress,
                      registryData.localityNameRu
                    );
                    setValue("legalEntity.address", address);
                    registryDataApplied = true;
                  }
                }
                if (registryData.registrationDate) {
                  // Format YYYY-MM-DD is expected by date input
                  setValue(
                    "legalEntity.registrationDate",
                    registryData.registrationDate
                  );
                  registryDataApplied = true;
                }

                if (registryData.ugdCode) {
                  setValue("legalEntity.ugd", registryData.ugdCode);
                  console.log(
                    `UGE Code from registry: ${registryData.ugdCode}, Name: ${registryData.ugdName}`
                  );
                  registryDataApplied = true;
                }
                // BIN is already set from EDS, registryData.bin confirms it.

                if (registryDataApplied) {
                  toast.success(
                    "Данные компании успешно загружены из гос. реестра по БИН." +
                      (registryData.ugdName
                        ? ` УГД: ${registryData.ugdName}`
                        : "")
                  );
                } else if (dataLoaded) {
                  toast.success(
                    "Данные из ЭЦП загружены. Дополнительные данные из реестра не найдены/не применены."
                  );
                } else {
                  toast.info(
                    "БИН найден в ЭЦП, но не удалось загрузить расширенные данные из гос. реестра."
                  );
                }
              }
            } catch (verifyError) {
              console.error("Error verifying BIN with backend:", verifyError);
              toast.error(
                "Ошибка при запросе данных компании из гос. реестра."
              );
            }
          } else {
            if (iinFromSubject && subject.commonName) {
              toast.info(
                `Загружен сертификат на имя: ${subject.commonName} (ИИН: ${iinFromSubject}). Пожалуйста, введите данные Вашей компании вручную, если это сертификат руководителя.`
              );
            } else {
              toast.info(
                "Не удалось автоматически извлечь название компании или БИН из сертификата. Пожалуйста, проверьте ЭЦП или введите данные вручную."
              );
            }
          }
          onSuccess();
        } else {
          toast.error(
            "Не удалось извлечь данные о владельце из сертификата в ответе сервера."
          );
        }
      } else {
        toast.error(
          "Ответ от сервера ЭЦП не содержит ожидаемой информации о подписанте."
        );
      }
    } catch (error) {
      console.error("Error processing signature:", error);
      toast.error(
        error instanceof Error
          ? `Ошибка обработки ЭЦП: ${error.message}`
          : "Произошла непредвиденная ошибка."
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="signatureFile">Файл ЭЦП (.p12)</Label>
        <Input
          id="signatureFile"
          type="file"
          {...register("signatureFile")}
          accept=".p12"
        />
        {errors.signatureFile && (
          <p className="text-sm text-destructive mt-1">
            {errors.signatureFile.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="password">Пароль от ЭЦП</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button
        type="button"
        onClick={handleSubmit(processSignature)}
        className="w-full"
      >
        Подписать и продолжить
      </Button>
    </div>
  );
}
