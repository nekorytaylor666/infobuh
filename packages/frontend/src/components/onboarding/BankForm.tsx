import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { Bank } from "./schema";
import { useFormContext } from "react-hook-form";

interface BankFormProps {
  banks: Bank[];
  onChange: (banks: Bank[]) => void;
  error?: string;
}

export function BankForm({ banks, onChange, error }: BankFormProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const [newBank, setNewBank] = useState<Bank>({
    name: "",
    bik: "",
    account: "",
  });

  const handleAddBank = () => {
    if (newBank.name && newBank.bik && newBank.account) {
      onChange([...banks, newBank]);
      setNewBank({ name: "", bik: "", account: "" });
    }
  };

  const handleRemoveBank = (index: number) => {
    const updatedBanks = banks.filter((_, i) => i !== index);
    onChange(updatedBanks);
  };

  const handleNewBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBank((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-4">
        {banks.map((bank, index) => (
          <div
            key={`bank-${index}`}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div>
                <Label>Название банка</Label>
                <div className="mt-1">{bank.name}</div>
              </div>
              <div>
                <Label>БИК</Label>
                <div className="mt-1">{bank.bik}</div>
              </div>
              <div>
                <Label>Счет</Label>
                <div className="mt-1">{bank.account}</div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveBank(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium">Добавить новый банк</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name">Название банка</Label>
            <Input
              id="name"
              name="name"
              value={newBank.name}
              onChange={handleNewBankChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="bik">БИК</Label>
            <Input
              id="bik"
              name="bik"
              value={newBank.bik}
              onChange={handleNewBankChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="account">Счет</Label>
            <Input
              id="account"
              name="account"
              value={newBank.account}
              onChange={handleNewBankChange}
              required
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddBank}
          disabled={!newBank.name || !newBank.bik || !newBank.account}
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить банк
        </Button>
      </div>
    </div>
  );
}
