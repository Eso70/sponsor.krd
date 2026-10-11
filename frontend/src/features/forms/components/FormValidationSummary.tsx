import type { FormEditorIssue } from "../form-editor-validation";

export function FormValidationSummary({
  issues,
  title,
  onSelect,
}: {
  issues: FormEditorIssue[];
  title: string;
  onSelect?: (issue: FormEditorIssue) => void;
}) {
  return (
    <div dir="auto" className="space-y-1 text-start text-xs leading-5">
      <p className="font-semibold">{title}</p>
      <ul className="list-inside list-disc">
        {issues.map((issue) => (
          <li key={issue.field}>
            {onSelect ? (
              <button
                type="button"
                className="text-start underline decoration-dotted underline-offset-2"
                onClick={() => onSelect(issue)}
              >
                {issue.message}
              </button>
            ) : (
              issue.message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
