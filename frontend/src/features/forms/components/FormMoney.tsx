import { productMoney, type ProductSelection } from "../product-selection";
import styles from "./FormPreview.module.css";

/** Isolate amounts from RTL text and the decorative Kurdish text font. */
export function FormMoney({
  value,
  currency,
}: {
  value: number;
  currency: ProductSelection["currency"];
}) {
  return (
    <bdi dir="ltr" className={styles.numeric}>
      {productMoney(value, currency)}
    </bdi>
  );
}
