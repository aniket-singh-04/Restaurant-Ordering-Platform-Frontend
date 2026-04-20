import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export const ADMIN_INPUT_CLASS =
  "ui-input";

export const ADMIN_LISTBOX_BUTTON_CLASS =
  "ui-select text-left";

export const ADMIN_LISTBOX_OPTIONS_CLASS =
  "absolute z-10 mt-2 w-full rounded-[1.25rem] border border-(--border-subtle) bg-(--surface-strong) p-1 shadow-(--shadow-md)";

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export const getAdminListboxOptionClass = (focus: boolean) =>
  `relative cursor-pointer select-none rounded-2xl py-3 pl-10 pr-4 ${
    focus
      ? "bg-(--accent-soft) text-(--accent)"
      : "text-(--text-primary)"
  }`;

export function AdminSection({
  title,
  children,
  className,
  titleClassName = "font-display text-2xl font-bold text-(--text-primary)",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={joinClasses("ui-card", className)}>
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
          "ui-field-label",
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
    <label className={joinClasses("flex cursor-pointer items-center gap-2 text-(--text-secondary)", containerClassName)}>
      <input type="checkbox" {...props} className={className} />
      {label}
    </label>
  );
}
