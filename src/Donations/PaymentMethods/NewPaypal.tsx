import React, { ReactElement } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

interface Props {
  paymentSetup: any;
  treeCount: number;
  treeCost: number;
  currency: string;
  donationID: any;
  payDonationFunction: Function;
}

function NewPaypal({
  paymentSetup,
  treeCount,
  treeCost,
  currency,
  donationID,
  payDonationFunction,
}: Props): ReactElement {
  const initialOptions = {
    "client-id": paymentSetup?.gateways.paypal.authorization.client_id,
    "enable-funding": "venmo,giropay,sofort",
    "disable-funding": "card",
    currency: currency,
  };

  function createOrder(data, actions) {
    return actions.order
      .create({
        purchase_units: [
          {
            amount: {
              value: treeCount * treeCost,
              currency: currency,
            },
            invoice_id: `planet-${donationID}`,
            custom_id:donationID
          },
        ],
        application_context: {
          brand_name: "Plant-for-the-Planet",
        },
      })
  }

  function onApprove(data, actions) {
    return actions.order.capture().then(function (details) {
      // This function shows a transaction success message to your buyer.
      payDonationFunction("paypal", data);
    });
  }

  const onError = (data) => {
    payDonationFunction("paypal", data);
  };

  const onCancel = (data) => {
    let error = {
      ...data,
      type: "error",
      error: { message: "Transaction cancelled" },
    };
    payDonationFunction("paypal", error);
  };

  return (
    <>
      <PayPalScriptProvider options={initialOptions}>
        <ReloadButton currency={currency} />
        <PayPalButtons
          createOrder={createOrder}
          onError={onError}
          onApprove={onApprove}
          onCancel={onCancel}
        />
      </PayPalScriptProvider>
    </>
  );
}

function ReloadButton({ currency }: any) {
  const [{ isPending, options }, dispatch] = usePayPalScriptReducer();

  React.useEffect(() => {
    dispatch({
      type: "resetOptions",
      value: {
        ...options,
        currency: currency,
      },
    });
  }, [currency]);

  return isPending ? <div className="spinner" /> : null;
}

export default NewPaypal;