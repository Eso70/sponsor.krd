import { useFormValidation } from "./FormValidationContext";

export function FormValidationNotice({ fields }: { fields: string[] }) {
  const validation = useFormValidation();
  if (!validation.attempted) return null;
  const issues = validation.issues.filter((issue) =>
    fields.includes(issue.field),
  );
  return (
    <>
      {issues.map((issue) => (
        <p
          key={issue.field}
          role="alert"
          className="mt-2 text-xs leading-5 text-rose-600 dark:text-rose-300"
        >
          {issue.message}
        </p>
      ))}
    </>
  );
}
