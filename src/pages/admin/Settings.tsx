import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { motion } from "framer-motion";
import { Store, Clock, Bell, CreditCard, Shield, Save } from "lucide-react";
import { useToast } from "../../context/ToastContext";

// --------------------
// Local reusable components
// --------------------
const buttonBase =
  "px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center justify-center";
const buttonVariants = {
  default: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  outline:
    "bg-transparent border border-gray-400 text-gray-800 hover:bg-gray-100",
  warm: "bg-orange-500 text-white hover:bg-orange-600",
  destructive: "bg-red-500 text-white hover:bg-red-600",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
};

function Button({
  children,
  variant = "default",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonBase} ${buttonVariants[variant] || ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

function Input({ label, id, className = "", ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={inputId} className="mb-1 font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400 ${className}`}
      />
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

function Textarea({ label, id, className = "", ...props }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={textareaId} className="mb-1 font-medium">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        {...props}
        className={`border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400 ${className}`}
      />
    </div>
  );
}

type SwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

function Switch({ checked, onChange, label }: SwitchProps) {
  const handleToggle = () => onChange(!checked);
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
        }
      }}
      className={`w-12 h-6 rounded-full p-1 flex items-center cursor-pointer transition-colors duration-200 ${
        checked ? "bg-orange-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </div>
  );
}

function Separator() {
  return <div className="border-t border-gray-200 my-4" />;
}

// --------------------
// Demo data
// --------------------
const settingSections = [
  {
    id: "restaurant",
    title: "Restaurant Details",
    icon: Store,
    fields: [
      {
        id: "name",
        label: "Restaurant Name",
        type: "text",
        value: "The Foodie Kitchen",
      },
      {
        id: "phone",
        label: "Phone Number",
        type: "tel",
        value: "+91 98765 43210",
      },
      {
        id: "email",
        label: "Email",
        type: "email",
        value: "contact@foodiekitchen.com",
      },
      {
        id: "address",
        label: "Address",
        type: "textarea",
        value: "123 Food Street, Cuisine City, FC 12345",
      },
    ],
  },
  {
    id: "hours",
    title: "Operating Hours",
    icon: Clock,
    fields: [
      { id: "openTime", label: "Opening Time", type: "time", value: "10:00" },
      { id: "closeTime", label: "Closing Time", type: "time", value: "22:00" },
    ],
  },
];

const toggleSettingsData = [
  {
    id: "orderNotifications",
    label: "Order Notifications",
    description: "Get notified for new orders",
    enabled: true,
  },
  {
    id: "autoAccept",
    label: "Auto-accept Orders",
    description: "Automatically accept incoming orders",
    enabled: false,
  },
  {
    id: "lowStockAlerts",
    label: "Low Stock Alerts",
    description: "Get alerts when items are running low",
    enabled: true,
  },
  {
    id: "customerFeedback",
    label: "Customer Feedback",
    description: "Allow customers to leave reviews",
    enabled: true,
  },
];

const paymentMethodsData = [
  { id: "upi", label: "UPI Payments", enabled: true },
  { id: "card", label: "Card Payments", enabled: true },
  { id: "cash", label: "Cash on Delivery", enabled: true },
];

// --------------------
// Main Settings Component
// --------------------
export default function Settings() {
  const { pushToast } = useToast();
  const [toggleSettings, setToggleSettings] = useState(toggleSettingsData);
  const [paymentMethods, setPaymentMethods] = useState(paymentMethodsData);
  const [formValues, setFormValues] = useState(
    Object.fromEntries(
      settingSections.flatMap((s) => s.fields.map((f) => [f.id, f.value])),
    ),
  );

  const handleSave = () => {
    pushToast({
      title: "Settings saved",
      description: "Your changes have been applied.",
      variant: "success",
    });
  };

  const handleToggle = (
    id: string,
    value: boolean,
    type: "settings" | "payments",
  ) => {
    if (type === "settings") {
      setToggleSettings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: value } : s)),
      );
    } else {
      setPaymentMethods((prev) =>
        prev.map((p) => (p.id === id ? { ...p, enabled: value } : p)),
      );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your restaurant settings</p>
        </div>
        <Button variant="warm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-md space-y-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <section.icon className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.id}
                className={field.type === "textarea" ? "md:col-span-2" : ""}
              >
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.id}
                    label={field.label}
                    value={formValues[field.id]}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <Input
                    id={field.id}
                    label={field.label}
                    type={field.type}
                    value={formValues[field.id]}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-md space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold">Notifications & Preferences</h2>
        </div>
        <div className="space-y-4">
          {toggleSettings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="font-medium">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              <Switch
                checked={setting.enabled}
                label={setting.label}
                onChange={(val: boolean) =>
                  handleToggle(setting.id, val, "settings")
                }
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-md space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold">Payment Methods</h2>
        </div>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between py-2"
            >
              <p className="font-medium">{method.label}</p>
              <Switch
                checked={method.enabled}
                label={method.label}
                onChange={(val: boolean) =>
                  handleToggle(method.id, val, "payments")
                }
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-md space-y-6 border-2 border-red-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pause Restaurant</p>
              <p className="text-sm text-gray-500">
                Temporarily stop accepting orders
              </p>
            </div>
            <Button
              variant="outline"
              className="text-red-500 border-red-500 hover:bg-red-100 cursor-pointer"
            >
              Pause
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Restaurant</p>
              <p className="text-sm text-gray-500">
                Permanently delete your restaurant data
              </p>
            </div>
            <Button variant="destructive" className="cursor-pointer">Delete</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
