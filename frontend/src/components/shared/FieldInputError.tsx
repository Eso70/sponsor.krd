import styles from "./FieldInputError.module.css";

/** A compact error inside a field; empty fields show the message as placeholder. */
export function FieldInputError({ id, message, empty }: { id: string; message: string; empty: boolean }) {
  return (
    <span id={id} role="alert" dir="auto" className={empty ? "sr-only" : styles.message}>
      {message}
    </span>
  );
}
