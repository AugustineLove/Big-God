import { useState, useEffect } from "react";
import {
  User, Mail, Phone, MapPin, CreditCard, Users,
  Calendar, UserCheck, X, CheckCircle, AlertCircle,
  DollarSign, PiggyBank, Home,
} from "lucide-react";
import { Account, Customer } from "../../../data/mockData";
import { useCustomers } from "../../../contexts/dashboard/Customers";
import { useAuth } from "../../../contexts/AuthContext";
import { useStaff } from "../../../contexts/dashboard/Staff";
import {
  getEffectiveCompanyId, makeSuSuProName,
  parentCompanyName, userPermissions,
} from "../../../constants/appConstants";
import toast from "react-hot-toast";
import { useAccountNumbers } from "../../../contexts/dashboard/NextAccNumbers";
import { useAccountNumber } from "../../../contexts/dashboard/NextAccountNumber";
import { useTransactions } from "../../../contexts/dashboard/Transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Staff {
  id: string;
  staff_id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string;
  company_id: string;
  created_at: string;
}

interface ClientModalProps {
  account: Account | null;
  client?: Customer | null;
  onSave: (client: any) => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-[12px] text-red-500 mt-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {msg}
    </p>
  ) : null;

const Label = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <p className="text-[12px] font-medium text-gray-500 mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
  </p>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 pb-2.5 border-b border-gray-100 mb-4">
    {children}
  </p>
);

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  error?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, name, value, onChange, type = "text",
  required, step, min, error, placeholder, readOnly,
}) => (
  <div>
    <Label required={required}>{label}</Label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      step={step}
      min={min}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full px-3.5 py-2.5 border rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:outline-none transition-all
        ${readOnly ? "cursor-default text-gray-500" : ""}
        ${error
          ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
          : "border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"}`}
    />
    <FieldError msg={error} />
  </div>
);

// ─── Account type options ─────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  {
    value: "Susu",
    label: "Susu",
    desc: "Daily contributions",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
  {
    value: "Savings",
    label: "Savings",
    desc: "Regular savings account",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export const ClientModal: React.FC<ClientModalProps> = ({
  account, client, onSave, onClose,
}) => {
  const { staffList, loading: staffLoading } = useStaff();
  const { addCustomer, customerLoading } = useCustomers();
  const { company } = useAuth();
  const { sendMessage } = useTransactions();
  const companyId = getEffectiveCompanyId();
  const { getNextAccountNumber, fetchLastAccountNumbers } = useAccountNumbers();
  const { nextAccountNumber } = useAccountNumber();

  const [startedAdding, setStartedAdding] = useState(false);
  const [nextAccNumber, setNextAccNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name:                 client?.name || "",
    email:                client?.email || "",
    phone_number:         client?.phone_number || "",
    momo_number:          client?.momo_number || "",
    account_number:       client?.account_number || "",
    city:                 client?.city || "",
    id_card:              client?.id_card || "",
    gender:               client?.gender
      ? client.gender.charAt(0).toUpperCase() + client.gender.slice(1)
      : "",
    next_of_kin:          client?.next_of_kin || "",
    location:             client?.location || "",
    daily_rate:           client?.daily_rate || "",
    date_of_registration: client?.date_of_registration
      ? client.date_of_registration.split("T")[0]
      : new Date().toISOString().split("T")[0],
    date_of_birth:        client?.date_of_birth
      ? client.date_of_birth.split("T")[0]
      : new Date().toISOString().split("T")[0],
    registered_by:        client?.registered_by || "",
    account_type:         account?.account_type || "",
    company_id:           companyId,
    created_by:           client?.registered_by,
  });

  const mobileBankers = !userPermissions.MANAGE_STAFF
    ? staffList.filter((s) =>
        ["Mobile Banker", "mobile banker", "mobile_banker", "teller"].includes(s.role)
      )
    : staffList;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (name === "registered_by" && value) {
      setNextAccNumber(getNextAccountNumber(value));
    }
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const setAccountType = (type: string) => {
    setFormData((p) => ({ ...p, account_type: type }));
    if (errors.account_type) setErrors((p) => ({ ...p, account_type: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim())        e.name        = "Full name is required";
    if (!formData.phone_number.trim()) e.phone_number = "Phone number is required";
    if (!formData.id_card.trim())     e.id_card     = "Ghana card number is required";
    if (!formData.registered_by)      e.registered_by = "Please assign a mobile banker";
    if (!formData.account_type)       e.account_type = "Please select an account type";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Please enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStartedAdding(true);
    const toastId = toast.loading(client ? "Updating client…" : "Adding client…");

    if (!client) {
      const suffix = formData.account_type === "Susu" ? "SU1" : "SA1";
      const account_number = `${nextAccNumber}${suffix}`;
      const data = {
        ...formData,
        company_id: companyId,
        total_balance: "0.00",
        total_transactions: "0",
        account_number: nextAccNumber,
      };
      try {
        const added = await addCustomer(data, formData.account_type, account_number);
        await fetchLastAccountNumbers();
        await sendMessage({
          messageTo: formData.phone_number,
          messageFrom: makeSuSuProName(parentCompanyName),
          message: `Dear ${formData.name}, you have successfully opened a ${formData.account_type} account with ${parentCompanyName}. Your account number is ${added.data.account_number}. Your secret withdrawal code is ${added.data.withdrawal_code}. Please do not share this code with anyone. Thank you for choosing us!`,
        });
        toast.success("Client added successfully", { id: toastId });
        onClose();
      } catch {
        toast.error("Failed to add client. Please try again.", { id: toastId });
      }
    } else {
      onSave({
        customer_id: client?.customer_id,
        ...formData,
        id: Date.now().toString(),
        joinDate: new Date().toISOString().split("T")[0],
      });
      toast.success("Client updated", { id: toastId });
      onClose();
    }
    setStartedAdding(false);
  };

  const isLoading = customerLoading || startedAdding;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-xl flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {client ? "Edit client" : "Add new client"}
              </p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {client
                  ? "Update customer details below"
                  : "Fill in the details to register a new customer"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* Personal information */}
          <div>
            <SectionTitle>Personal information</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" name="name" value={formData.name} onChange={handleChange} required error={errors.name} placeholder="e.g. Kwame Asante" />
              <Field label="Phone number" name="phone_number" value={formData.phone_number} onChange={handleChange} required error={errors.phone_number} placeholder="+233 24 000 0000" />
              <Field label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
              <Field label="MoMo number" name="momo_number" value={formData.momo_number} onChange={handleChange} placeholder="+233 24 000 0000" />
              <Field label="Ghana card" name="id_card" value={formData.id_card} onChange={handleChange} required error={errors.id_card} placeholder="GHA-000000000-0" />

              {/* Gender */}
              <div>
                <Label>Gender</Label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all appearance-none"
                >
                  <option value="">Select gender…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <Field label="Date of birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
              <Field label="Date of registration" name="date_of_registration" type="date" value={formData.date_of_registration} onChange={handleChange} />
            </div>
          </div>

          {/* Location & contacts */}
          <div>
            <SectionTitle>Location & contacts</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Town / City" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Accra" />
              <Field label="Area / Location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Kasoa, Lapaz" />
              <div className="col-span-2">
                <Field label="Next of kin" name="next_of_kin" value={formData.next_of_kin} onChange={handleChange} placeholder="Emergency contact person" />
              </div>
            </div>
          </div>

          {/* Account setup */}
          <div>
            <SectionTitle>Account setup</SectionTitle>

            {/* Account type cards */}
            <div className="mb-4">
              <Label required>Account type</Label>
              <div className="grid grid-cols-2 gap-2">
                {ACCOUNT_TYPES.map((opt) => {
                  const active = formData.account_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccountType(opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 border-2 rounded-2xl text-left transition-all
                        ${active
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-gray-100 bg-white hover:border-indigo-200"}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                        ${active ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className={`text-[13px] font-semibold ${active ? "text-indigo-700" : "text-gray-900"}`}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-gray-400">{opt.desc}</p>
                      </div>
                      {active && (
                        <CheckCircle className="w-4 h-4 text-indigo-500 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errors.account_type} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Mobile banker */}
              <div>
                <Label required>Mobile banker</Label>
                <select
                  name="registered_by"
                  value={formData.registered_by}
                  onChange={handleChange}
                  disabled={staffLoading}
                  className={`w-full px-3.5 py-2.5 border rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:outline-none transition-all appearance-none
                    ${errors.registered_by
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
                      : "border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"}`}
                >
                  <option value="">
                    {staffLoading ? "Loading…" : "Select mobile banker…"}
                  </option>
                  {mobileBankers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} · {b.staff_id}
                    </option>
                  ))}
                </select>
                {mobileBankers.length === 0 && !staffLoading && (
                  <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No mobile bankers available
                  </p>
                )}
                <FieldError msg={errors.registered_by} />
              </div>

              {/* Daily rate */}
              <div>
                <Label>Daily rate</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-400">¢</span>
                  <input
                    type="number"
                    name="daily_rate"
                    value={formData.daily_rate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Auto-generated account number */}
            {nextAccNumber && (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <p className="text-[12px] text-gray-400">Auto-generated account number</p>
                <p className="text-[14px] font-semibold text-gray-800 font-mono tracking-wide">
                  {nextAccNumber}
                  {formData.account_type === "Susu" ? "SU1" : formData.account_type === "Savings" ? "SA1" : ""}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-2xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                {client ? "Updating…" : "Adding…"}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {client ? "Update client" : "Add client"}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClientModal;
