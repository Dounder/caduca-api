import { USER_AUDIT_SELECT } from 'src/user';
import { PRODUCT_CODE_SELECT_SUMMARY } from 'src/product';

export const VOUCHER_ITEM_SINGLE = {
  id: true,
  expirationDate: true,
  observation: true,
  received: true,
  quantity: true,

  productCode: PRODUCT_CODE_SELECT_SUMMARY,
};
