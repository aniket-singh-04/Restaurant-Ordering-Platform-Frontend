import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export const ADMIN_INPUT_CLASS =
  "w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400";

export const ADMIN_LISTBOX_BUTTON_CLASS =
  "w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-orange-400";

export const ADMIN_LISTBOX_OPTIONS_CLASS =
  "absolute mt-1 w-full bg-white border border-[#e5d5c6] rounded-xl shadow-md z-10";

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export const getAdminListboxOptionClass = (focus: boolean) =>
  `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
    focus ? "bg-orange-100 text-orange-600" : "text-[#1f1914]"
  }`;

export function AdminSection({
  title,
  children,
  className,
  titleClassName = "text-2xl font-bold text-[#1f1914]",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={joinClasses("bg-white p-6 rounded-2xl", className)}>
      {title ? <h2 className={titleClassName}>{title}</h2> : null}
      {children}
    </div>
  );
}

export function AdminField({
  label,
  htmlFor,
  children,
  className,
  labelClassName,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className={joinClasses(
          "block mb-1 font-medium",
          labelClassName,
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

type AdminInputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export function AdminInputField({
  label,
  error,
  id,
  containerClassName,
  labelClassName,
  inputClassName,
  ...props
}: AdminInputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <AdminField
      label={label}
      htmlFor={inputId}
      className={containerClassName}
      labelClassName={labelClassName}
    >
      <input
        id={inputId}
        {...props}
        className={joinClasses(ADMIN_INPUT_CLASS, inputClassName)}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </AdminField>
  );
}

type AdminTextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
};

export function AdminTextareaField({
  label,
  error,
  id,
  containerClassName,
  labelClassName,
  textareaClassName,
  ...props
}: AdminTextareaFieldProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <AdminField
      label={label}
      htmlFor={textareaId}
      className={containerClassName}
      labelClassName={labelClassName}
    >
      <textarea
        id={textareaId}
        {...props}
        className={joinClasses(ADMIN_INPUT_CLASS, textareaClassName)}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </AdminField>
  );
}

type AdminCheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  containerClassName?: string;
};

export function AdminCheckboxField({
  label,
  containerClassName,
  className,
  ...props
}: AdminCheckboxFieldProps) {
  return (
    <label className={joinClasses("flex items-center gap-2 cursor-pointer", containerClassName)}>
      <input type="checkbox" {...props} className={className} />
      {label}
    </label>
  );
}
