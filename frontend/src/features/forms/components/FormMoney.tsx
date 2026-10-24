import { productMoney, type ProductSelection } from "../product-selection";
import styles from "./FormPreview.module.css";

/** Isolate amounts from RTL text while retaining the shared Kurdish font. */
export function FormMoney({
  value,
  currency,
  emphasis = false,
}: {
  value: number;
  currency: ProductSelection["currency"];
  emphasis?: boolean;
}) {
  return (
    <bdi dir="ltr" className={`${styles.numeric} inline-block max-w-full break-words tabular-nums leading-snug ${emphasis ? "text-base font-semibold tracking-tight" : "font-medium"}`}>
      {productMoney(value, currency)}
    </bdi>
  );
}
